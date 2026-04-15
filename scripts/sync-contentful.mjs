// scripts/sync-contentful.mjs
// Fetches all blog posts from Contentful and writes them as markdown files
// Run: npm run sync

import { createClient } from "contentful";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const API_KEY = process.env.CONTENTFUL_API_KEY;
const POST_DIR = path.join(__dirname, "..", "src", "content", "post");

if (!SPACE_ID || !API_KEY) {
  console.error("❌ Missing CONTENTFUL_SPACE_ID or CONTENTFUL_API_KEY in .env");
  process.exit(1);
}

const client = createClient({
  space: SPACE_ID,
  accessToken: API_KEY,
});

// Convert Rich Text JSON to Markdown
function richTextToMarkdown(doc, syntaxLang = "") {
  if (!doc || !doc.content) return "";
  return doc.content.map((node) => nodeToMd(node, syntaxLang)).join("\n\n");
}

function nodeToMd(node, syntaxLang) {
  switch (node.nodeType) {
    case "paragraph":
      return paragraphToMd(node, syntaxLang);
    case "heading-1":
      return `# ${inlineToMd(node.content)}`;
    case "heading-2":
      return `## ${inlineToMd(node.content)}`;
    case "heading-3":
      return `### ${inlineToMd(node.content)}`;
    case "heading-4":
      return `#### ${inlineToMd(node.content)}`;
    case "unordered-list":
      return node.content
        .map((li) => listItemToMd(li, "- ", syntaxLang))
        .join("\n");
    case "ordered-list":
      return node.content
        .map((li, i) => listItemToMd(li, `${i + 1}. `, syntaxLang))
        .join("\n");
    case "blockquote":
      return node.content
        .map((child) => `> ${nodeToMd(child, syntaxLang)}`)
        .join("\n> \n");
    case "hr":
      return "---";
    case "embedded-asset-block":
      return embeddedAssetToMd(node);
    default:
      if (node.content) {
        return node.content.map((n) => nodeToMd(n, syntaxLang)).join("\n\n");
      }
      return "";
  }
}

function paragraphToMd(node, syntaxLang) {
  // Check if this paragraph is actually a code block
  // If the entire paragraph content is code-marked, render as fenced code block
  if (node.content && node.content.length >= 1) {
    const allCode = node.content.every(
      (n) => n.nodeType === "text" && n.marks && n.marks.some((m) => m.type === "code")
    );
    if (allCode) {
      const codeText = node.content.map((n) => n.value).join("");
      const lang = syntaxLang || "";
      return "```" + lang + "\n" + codeText + "\n```";
    }
  }

  return inlineToMd(node.content);
}

function inlineToMd(content) {
  if (!content) return "";
  return content
    .map((node) => {
      if (node.nodeType === "text") {
        let text = node.value;
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case "bold":
                text = `**${text}**`;
                break;
              case "italic":
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
        }
        return text;
      }
      if (node.nodeType === "hyperlink") {
        const linkText = inlineToMd(node.content);
        const url = node.data?.uri || "#";
        return `[${linkText}](${url})`;
      }
      if (node.nodeType === "embedded-entry-inline") {
        return "";
      }
      return "";
    })
    .join("");
}

function listItemToMd(node, prefix, syntaxLang) {
  if (!node.content) return prefix;
  return node.content
    .map((child) => {
      const md = nodeToMd(child, syntaxLang);
      return prefix + md;
    })
    .join("\n");
}

function embeddedAssetToMd(node) {
  try {
    const { file, title, description } = node.data.target.fields;
    const url = file.url.startsWith("//") ? `https:${file.url}` : file.url;
    const alt = description || title || "Blog image";
    // Use HTML img tag for better control
    return `<img src="${url}" alt="${alt}" style="width:100%;margin:1rem 0;border-radius:8px" />`;
  } catch {
    return "";
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function sync() {
  console.log("🔄 Fetching blogs from Contentful...\n");

  const res = await client.getEntries({
    content_type: "blog",
    order: "-sys.createdAt",
    limit: 100,
    include: 2, // resolve linked assets (images)
  });

  console.log(`📝 Found ${res.items.length} blog posts\n`);

  // Ensure post directory exists
  if (!fs.existsSync(POST_DIR)) {
    fs.mkdirSync(POST_DIR, { recursive: true });
  }

  // Remove existing .md files
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

  for (const item of res.items) {
    const { title, slug, shortDescription, blogDescription, featuredImage, syntaxHighlight } =
      item.fields;
    const createdAt = item.sys.createdAt;
    const publishDate = new Date(createdAt).toISOString().split("T")[0];

    const postSlug = slug || slugify(title);
    const lang = syntaxHighlight || "";

    // Categorize posts into Engineering or Essays
    const engineeringKeywords = ["rust", "python", "neat", "simulation", "code", "programming", "api", "react", "node", "deploy", "git", "docker", "algorithm"];
    const titleLower = title.toLowerCase();
    const descLower = (shortDescription || "").toLowerCase();
    const combined = titleLower + " " + descLower;
    const isEngineering = engineeringKeywords.some((kw) => combined.includes(kw)) || !!syntaxHighlight;
    const tags = isEngineering ? ["engineering"] : ["essays"];

    // Convert Rich Text to Markdown
    let mdContent = "";
    if (blogDescription) {
      try {
        mdContent = richTextToMarkdown(blogDescription, lang);
      } catch (err) {
        console.warn(`  ⚠️  Rich text conversion failed for "${title}": ${err.message}`);
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
      `tags: [${tags.map(t => `"${t}"`).join(", ")}]`,
      "---",
      "",
    ].join("\n");

    // Featured image
    let featuredImg = "";
    if (featuredImage) {
      const imgUrl = featuredImage.startsWith("//")
        ? `https:${featuredImage}`
        : featuredImage;
      featuredImg = `<img src="${imgUrl}" alt="${escapedTitle}" style="width:100%;margin:1rem 0;border-radius:8px" />\n\n`;
    }

    const fileContent = frontmatter + featuredImg + mdContent + "\n";
    const fileName = `${postSlug}.md`;
    const filePath = path.join(POST_DIR, fileName);

    fs.writeFileSync(filePath, fileContent, "utf-8");
    console.log(`  ✅ ${title} → ${fileName} (${publishDate}) [${tags.join(", ")}]`);
  }

  console.log(`\n✨ Synced ${res.items.length} posts to src/content/post/`);
  console.log("   Run 'npm run dev' to see your site.");
}

sync().catch((err) => {
  console.error("❌ Sync failed:", err.message);
  process.exit(1);
});
