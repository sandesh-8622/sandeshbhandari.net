// scripts/migrate-contentful-to-sanity.mjs
// One-time migration: reads all blog posts from Contentful and writes them into Sanity.
//
// Prerequisites:
//   npm install contentful @sanity/client @sanity/image-url dotenv node-fetch
//
// Usage:
//   CONTENTFUL_SPACE_ID=xxx CONTENTFUL_API_KEY=xxx \
//   SANITY_PROJECT_ID=xxx SANITY_DATASET=xxx SANITY_API_TOKEN=xxx \
//   node scripts/migrate-contentful-to-sanity.mjs
//
// Or place those values in a .env file at the repo root.

import { createClient as createContentfulClient } from "contentful";
import { createClient as createSanityClient } from "@sanity/client";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ── Contentful setup ────────────────────────────────────────────────
const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const CONTENTFUL_API_KEY = process.env.CONTENTFUL_API_KEY;

if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_API_KEY) {
  console.error("❌ Missing CONTENTFUL_SPACE_ID or CONTENTFUL_API_KEY");
  process.exit(1);
}

const contentful = createContentfulClient({
  space: CONTENTFUL_SPACE_ID,
  accessToken: CONTENTFUL_API_KEY,
});

// ── Sanity setup ────────────────────────────────────────────────────
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.SANITY_DATASET || "production";
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;

if (!SANITY_PROJECT_ID || !SANITY_API_TOKEN) {
  console.error("❌ Missing SANITY_PROJECT_ID or SANITY_API_TOKEN");
  process.exit(1);
}

const sanity = createSanityClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: SANITY_API_TOKEN,
  useCdn: false,
});

// ── Helpers ─────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Upload an image URL to Sanity and return an asset reference.
 */
async function uploadImageToSanity(imageUrl, filename) {
  const url = imageUrl.startsWith("//") ? `https:${imageUrl}` : imageUrl;
  console.log(`    📷 Uploading image: ${filename || url.slice(-40)}`);

  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`    ⚠️  Failed to fetch image: ${url}`);
    return null;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/png";

  try {
    const asset = await sanity.assets.upload("image", buffer, {
      filename: filename || "blog-image.png",
      contentType,
    });
    return {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
    };
  } catch (err) {
    console.warn(`    ⚠️  Image upload failed: ${err.message}`);
    return null;
  }
}

/**
 * Convert a Contentful Rich Text document to Sanity's Portable Text format.
 */
async function richTextToPortableText(doc, syntaxLang = "") {
  if (!doc || !doc.content) return [];
  const blocks = [];

  for (const node of doc.content) {
    const converted = await nodeToBlock(node, syntaxLang);
    if (converted) {
      if (Array.isArray(converted)) {
        blocks.push(...converted);
      } else {
        blocks.push(converted);
      }
    }
  }

  return blocks;
}

async function nodeToBlock(node, syntaxLang) {
  const key = () => Math.random().toString(36).slice(2, 10);

  switch (node.nodeType) {
    case "paragraph": {
      // Check if entire paragraph is code-marked → code block
      if (node.content && node.content.length >= 1) {
        const allCode = node.content.every(
          (n) => n.nodeType === "text" && n.marks && n.marks.some((m) => m.type === "code")
        );
        if (allCode) {
          const codeText = node.content.map((n) => n.value).join("");
          return {
            _type: "code",
            _key: key(),
            language: syntaxLang || "text",
            code: codeText,
          };
        }
      }

      // Check if paragraph contains SVG markup
      const fullText = (node.content || [])
        .filter((n) => n.nodeType === "text")
        .map((n) => n.value)
        .join("");
      if (fullText.trim().startsWith("<svg") && fullText.trim().endsWith("</svg>")) {
        return {
          _type: "svgEmbed",
          _key: key(),
          svgMarkup: fullText.trim(),
          alt: "Embedded SVG diagram",
        };
      }

      const children = inlineToSpans(node.content);
      if (children.length === 0) return null;
      return {
        _type: "block",
        _key: key(),
        style: "normal",
        children,
        markDefs: extractMarkDefs(node.content),
      };
    }

    case "heading-1":
    case "heading-2":
    case "heading-3":
    case "heading-4": {
      const level = node.nodeType.replace("heading-", "");
      return {
        _type: "block",
        _key: key(),
        style: `h${level}`,
        children: inlineToSpans(node.content),
        markDefs: extractMarkDefs(node.content),
      };
    }

    case "unordered-list":
    case "ordered-list": {
      const listStyle = node.nodeType === "unordered-list" ? "bullet" : "number";
      const items = [];
      for (const li of node.content || []) {
        for (const child of li.content || []) {
          if (child.nodeType === "paragraph") {
            items.push({
              _type: "block",
              _key: key(),
              style: "normal",
              listItem: listStyle,
              level: 1,
              children: inlineToSpans(child.content),
              markDefs: extractMarkDefs(child.content),
            });
          }
        }
      }
      return items;
    }

    case "blockquote": {
      const items = [];
      for (const child of node.content || []) {
        if (child.nodeType === "paragraph") {
          items.push({
            _type: "block",
            _key: key(),
            style: "blockquote",
            children: inlineToSpans(child.content),
            markDefs: extractMarkDefs(child.content),
          });
        }
      }
      return items;
    }

    case "hr":
      return {
        _type: "block",
        _key: key(),
        style: "normal",
        children: [{ _type: "span", _key: key(), text: "---", marks: [] }],
        markDefs: [],
      };

    case "embedded-asset-block": {
      try {
        const { file, title, description } = node.data.target.fields;
        const url = file.url;
        const contentType = file.contentType || "";
        const filename = file.fileName || "image.png";

        // If it's an SVG, store as SVG embed
        if (contentType.includes("svg") || filename.endsWith(".svg")) {
          try {
            const fullUrl = url.startsWith("//") ? `https:${url}` : url;
            const resp = await fetch(fullUrl);
            const svgText = await resp.text();
            return {
              _type: "svgEmbed",
              _key: key(),
              svgMarkup: svgText,
              alt: description || title || "SVG diagram",
            };
          } catch {
            // Fall through to image upload
          }
        }

        const imageRef = await uploadImageToSanity(url, filename);
        if (imageRef) {
          imageRef._key = key();
          imageRef.alt = description || title || "Blog image";
          return imageRef;
        }
      } catch {
        // Skip broken assets
      }
      return null;
    }

    default:
      // Recurse for unknown wrapper nodes
      if (node.content) {
        const results = [];
        for (const child of node.content) {
          const block = await nodeToBlock(child, syntaxLang);
          if (block) {
            if (Array.isArray(block)) results.push(...block);
            else results.push(block);
          }
        }
        return results.length > 0 ? results : null;
      }
      return null;
  }
}

function inlineToSpans(content) {
  if (!content) return [{ _type: "span", _key: rk(), text: "", marks: [] }];
  const spans = [];

  for (const node of content) {
    if (node.nodeType === "text") {
      const marks = (node.marks || []).map((m) => {
        if (m.type === "bold") return "strong";
        if (m.type === "italic") return "em";
        if (m.type === "code") return "code";
        if (m.type === "underline") return "underline";
        return m.type;
      });
      spans.push({
        _type: "span",
        _key: rk(),
        text: node.value || "",
        marks,
      });
    } else if (node.nodeType === "hyperlink") {
      const markKey = rk();
      const linkText = (node.content || [])
        .filter((n) => n.nodeType === "text")
        .map((n) => n.value)
        .join("");
      spans.push({
        _type: "span",
        _key: rk(),
        text: linkText,
        marks: [markKey],
        _markDef: {
          _type: "link",
          _key: markKey,
          href: node.data?.uri || "#",
        },
      });
    }
  }

  return spans.length > 0
    ? spans
    : [{ _type: "span", _key: rk(), text: "", marks: [] }];
}

function extractMarkDefs(content) {
  if (!content) return [];
  const defs = [];

  for (const node of content) {
    if (node.nodeType === "hyperlink") {
      const markKey = rk();
      // We need to match with the spans — this is handled by _markDef on spans
    }
  }

  // Collect _markDef from already-built spans
  return [];
}

// We'll fix markDefs after building spans
function fixMarkDefs(block) {
  if (!block || block._type !== "block") return block;
  const markDefs = [];
  for (const span of block.children || []) {
    if (span._markDef) {
      markDefs.push(span._markDef);
      delete span._markDef;
    }
  }
  block.markDefs = markDefs;
  return block;
}

function rk() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Main migration ──────────────────────────────────────────────────

async function migrate() {
  console.log("🔄 Fetching blog posts from Contentful...\n");

  const res = await contentful.getEntries({
    content_type: "blog",
    order: "-sys.createdAt",
    limit: 100,
    include: 2,
  });

  console.log(`📝 Found ${res.items.length} blog posts\n`);

  let success = 0;
  let failed = 0;

  for (const item of res.items) {
    const { title, slug, shortDescription, blogDescription, featuredImage, syntaxHighlight } =
      item.fields;
    const createdAt = item.sys.createdAt;
    const postSlug = slugify(slug || title);
    const lang = syntaxHighlight || "";

    console.log(`\n  📄 Migrating: "${title}"`);

    try {
      // Convert rich text body to Portable Text
      let body = [];
      if (blogDescription) {
        body = await richTextToPortableText(blogDescription, lang);
        // Fix markDefs on all blocks
        body = body.map((b) => {
          if (b._type === "block") return fixMarkDefs(b);
          return b;
        });
      }

      // Upload featured image
      let featuredImageRef = null;
      if (featuredImage) {
        const imgUrl =
          typeof featuredImage === "string"
            ? featuredImage
            : featuredImage?.fields?.file?.url;
        if (imgUrl) {
          featuredImageRef = await uploadImageToSanity(imgUrl, `${postSlug}-featured.png`);
        }
      }

      // Build Sanity document
      const doc = {
        _type: "blog",
        _id: `blog-${postSlug}`,
        title,
        slug: { _type: "slug", current: postSlug },
        publishDate: new Date(createdAt).toISOString(),
        shortDescription: shortDescription || "",
        syntaxHighlight: lang || undefined,
        body,
      };

      if (featuredImageRef) {
        doc.featuredImage = featuredImageRef;
      }

      // Create or replace in Sanity
      await sanity.createOrReplace(doc);
      console.log(`  ✅ Written to Sanity: blog-${postSlug}`);
      success++;
    } catch (err) {
      console.error(`  ❌ Failed: "${title}" — ${err.message}`);
      failed++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✨ Migration complete: ${success} succeeded, ${failed} failed`);
  console.log(`   Your posts are now in Sanity (project: ${SANITY_PROJECT_ID}, dataset: ${SANITY_DATASET})`);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
