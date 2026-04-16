// scripts/sync-sanity.mjs
// Fetches all blog posts from Sanity and writes them as markdown files
// Run: npm run sync

import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET || "production";
const API_TOKEN = process.env.SANITY_API_TOKEN;
const POST_DIR = path.join(__dirname, "..", "src", "content", "post");

if (!PROJECT_ID || !API_TOKEN) {
  console.error("❌ Missing SANITY_PROJECT_ID or SANITY_API_TOKEN in .env");
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: "2024-01-01",
  token: API_TOKEN,
  useCdn: false,
});

const builder = imageUrlBuilder(client);
function imageUrl(ref) {
  if (!ref) return null;
  return builder.image(ref).auto("format").url();
}

// ── Portable Text → Markdown ────────────────────────────────────────

function portableTextToMarkdown(blocks, defaultLang = "") {
  if (!blocks || !Array.isArray(blocks)) return "";
  const parts = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // Collect consecutive list items into a single list
    if (block._type === "block" && block.listItem) {
      const listBlocks = [];
      const listStyle = block.listItem;
      while (i < blocks.length && blocks[i]._type === "block" && blocks[i].listItem === listStyle) {
        listBlocks.push(blocks[i]);
        i++;
      }
      const prefix = listStyle === "number" ? (idx) => `${idx + 1}. ` : () => "- ";
      const listMd = listBlocks
        .map((lb, idx) => prefix(idx) + spansToMarkdown(lb.children, lb.markDefs))
        .join("\n");
      parts.push(listMd);
      continue;
    }

    const md = blockToMarkdown(block, defaultLang);
    if (md !== null) parts.push(md);
    i++;
  }

  return parts.join("\n\n");
}

function blockToMarkdown(block, defaultLang) {
  if (!block) return null;

  switch (block._type) {
    case "block": {
      const text = spansToMarkdown(block.children, block.markDefs);

      switch (block.style) {
        case "h1":
          return `# ${text}`;
        case "h2":
          return `## ${text}`;
        case "h3":
          return `### ${text}`;
        case "h4":
          return `#### ${text}`;
        case "blockquote":
          return text
            .split("\n")
            .map((line) => `> ${line}`)
            .join("\n");
        case "normal":
        default:
          // Check for horizontal rule placeholder
          if (text.trim() === "---") return "---";
          return text || "";
      }
    }

    case "code": {
      const lang = block.language || defaultLang || "";
      const code = block.code || "";
      return "```" + lang + "\n" + code + "\n```";
    }

    case "image": {
      const url = imageUrl(block.asset || block);
      if (!url) return null;
      const alt = block.alt || "Blog image";
      return `<img src="${url}" alt="${alt}" style="width:100%;margin:1rem 0;border-radius:8px" />`;
    }

    case "svgEmbed": {
      const svg = block.svgMarkup || "";
      if (!svg) return null;
      return '<div style="width:100%;margin:1.5rem 0">' + svg.replace(/<svg /, '<svg width="100%" height="auto" style="max-width:100%" ') + '</div>';
    }

    default:
      return null;
  }
}

function spansToMarkdown(children, markDefs = []) {
  if (!children) return "";

  const markDefMap = {};
  for (const md of markDefs || []) {
    markDefMap[md._key] = md;
  }

  return children
    .map((span) => {
      if (span._type !== "span") return "";
      let text = span.text || "";

      // Process marks
      const marks = span.marks || [];
      let linkHref = null;

      for (const mark of marks) {
        // Check if mark references a markDef (annotation like link)
        if (markDefMap[mark]) {
          const def = markDefMap[mark];
          if (def._type === "link") {
            linkHref = def.href;
          }
          continue;
        }

        // Decorator marks
        switch (mark) {
          case "strong":
            text = `**${text}**`;
            break;
          case "em":
            text = `*${text}*`;
            break;
          case "code":
            text = "`" + text + "`";
            break;
          case "underline":
            text = `<u>${text}</u>`;
            break;
        }
      }

      if (linkHref) {
        text = `[${text}](${linkHref})`;
      }

      return text;
    })
    .join("");
}

// ── Tag categorization ──────────────────────────────────────────────

const ENGINEERING_KEYWORDS = [
  "rust",
  "python",
  "neat",
  "simulation",
  "code",
  "programming",
  "api",
  "react",
  "node",
  "deploy",
  "git",
  "docker",
  "algorithm",
];

function categorizeTags(title, description, syntaxHighlight) {
  const combined = `${title} ${description || ""}`.toLowerCase();
  const isEngineering =
    ENGINEERING_KEYWORDS.some((kw) => combined.includes(kw)) || !!syntaxHighlight;
  return isEngineering ? ["engineering"] : ["essays"];
}

// ── GROQ query ──────────────────────────────────────────────────────

const QUERY = `*[_type == "blog"] | order(publishDate desc) {
  _id,
  title,
  "slug": slug.current,
  publishDate,
  shortDescription,
  syntaxHighlight,
  featuredImage {
    asset->,
    alt
  },
  body[] {
    ...,
    _type == "image" => {
      ...,
      asset->
    }
  }
}`;

// ── Main sync ───────────────────────────────────────────────────────

async function sync() {
  console.log("🔄 Fetching blog posts from Sanity...\n");

  const posts = await client.fetch(QUERY);
  console.log(`📝 Found ${posts.length} blog posts\n`);

  // Ensure post directory exists
  if (!fs.existsSync(POST_DIR)) {
    fs.mkdirSync(POST_DIR, { recursive: true });
  }

  // Remove existing .md files and subdirectories
  const existing = fs.readdirSync(POST_DIR);
  for (const file of existing) {
    const filePath = path.join(POST_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && file.endsWith(".md")) {
      fs.unlinkSync(filePath);
    } else if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true });
    }
  }

  for (const post of posts) {
    const {
      title,
      slug,
      publishDate: rawDate,
      shortDescription,
      syntaxHighlight,
      featuredImage,
      body,
    } = post;

    const publishDate = rawDate
      ? new Date(rawDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const postSlug = slug || slugify(title);
    const tags = categorizeTags(title, shortDescription, syntaxHighlight);
    const lang = syntaxHighlight || "";

    // Convert body to markdown
    let mdContent = "";
    if (body) {
      try {
        mdContent = portableTextToMarkdown(body, lang);
      } catch (err) {
        console.warn(`  ⚠️  Body conversion failed for "${title}": ${err.message}`);
        mdContent = "Content could not be rendered.";
      }
    }

    // Build frontmatter
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedDesc = (shortDescription || "").replace(/"/g, '\\"');
    const frontmatter = [
      "---",
      `title: "${escapedTitle}"`,
      `description: "${escapedDesc}"`,
      `publishDate: "${publishDate}"`,
      `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`,
      "---",
      "",
    ].join("\n");

    // Featured image
    let featuredImg = "";
    if (featuredImage?.asset) {
      const imgSrc = imageUrl(featuredImage.asset);
      if (imgSrc) {
        const alt = featuredImage.alt || escapedTitle;
        featuredImg = `<img src="${imgSrc}" alt="${alt}" style="width:100%;margin:1rem 0;border-radius:8px" />\n\n`;
      }
    }

    const fileContent = frontmatter + featuredImg + mdContent + "\n";
    const fileName = `${postSlug}.md`;
    const filePath = path.join(POST_DIR, fileName);

    fs.writeFileSync(filePath, fileContent, "utf-8");
    console.log(`  ✅ ${title} → ${fileName} (${publishDate}) [${tags.join(", ")}]`);
  }

  console.log(`\n✨ Synced ${posts.length} posts to src/content/post/`);
  console.log("   Run 'npm run dev' to see your site.");
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

sync().catch((err) => {
  console.error("❌ Sync failed:", err.message);
  process.exit(1);
});
