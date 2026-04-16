# sandeshbhandari.net — Blog Setup Guide

## Architecture

- **Site:** Astro static site deployed on Vercel
- **CMS:** Sanity (Project ID: `oap2klyq`, Dataset: `production`)
- **Studio:** [sandeshbhandari-studio.sanity.studio](https://sandeshbhandari-studio.sanity.studio)
- **Live site:** [sandeshbhandari-net.vercel.app](https://sandeshbhandari-net.vercel.app)

---

## How to Write / Edit a Blog Post

1. Go to [sandeshbhandari-studio.sanity.studio](https://sandeshbhandari-studio.sanity.studio)
2. Click **Blog Post** → click **+** to create new, or click an existing post to edit
3. Fill in: title, slug, body (rich text), publish date, short description
4. Hit **Publish**
5. Vercel auto-deploys via webhook — your site updates in ~30 seconds

That's it. No terminal needed.

---

## How It Works (Under the Hood)

```
Sanity Studio → Publish → Webhook triggers Vercel → Vercel runs npm run sync → 
sync-sanity.mjs pulls posts from Sanity API → converts to markdown → Astro builds site
```

---

## Local Development

### Prerequisites
- Node.js (v18+)
- Git

### Clone and run the site locally

```bash
git clone https://github.com/sandesh-8622/sandeshbhandari.net.git
cd sandeshbhandari.net
```

Create a `.env` file in the project root:

```
SANITY_PROJECT_ID=oap2klyq
SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token
```

Then:

```bash
npm install
npm run sync    # pulls posts from Sanity → markdown files
npm run dev     # starts dev server at http://localhost:4321
```

### Run Sanity Studio locally

```bash
cd sandeshbhandari-studio
npm install
npm run dev     # starts Studio at http://localhost:3333
```

---

## Project Structure

```
sandeshbhandari.net/
├── scripts/
│   ├── sync-sanity.mjs          # pulls posts from Sanity → markdown
│   └── migrate-contentful-to-sanity.mjs  # one-time migration (can delete)
├── sanity/
│   └── schemas/
│       └── blog.js              # Sanity schema definition
├── src/
│   └── content/
│       └── post/                # generated markdown files (don't edit manually)
├── package.json
└── .env                         # Sanity credentials (not committed)

sandeshbhandari-studio/          # separate folder
├── schemaTypes/
│   ├── index.js                 # registers blog schema
│   └── blog.js                  # blog schema
├── sanity.config.js             # Studio config with plugins
└── package.json
```

---

## Blog Schema Fields

| Field | Type | Description |
|-------|------|-------------|
| title | string | Post title (max 60 chars) |
| slug | slug | URL slug (auto-generated from title) |
| publishDate | datetime | When the post was published |
| shortDescription | text | Brief description for post cards |
| syntaxHighlight | string | Default code language (e.g. rust, python) |
| featuredImage | image | Optional header image |
| body | rich text | Post content with text, images, code blocks, SVG embeds |

---

## Tag Categorization (Automatic)

Posts are auto-tagged based on title and description:
- Contains `rust`, `python`, `code`, `programming`, `api`, `react`, `node`, `docker`, `algorithm`, `simulation`, `neat`, `deploy`, `git` → **engineering**
- Has a `syntaxHighlight` language set → **engineering**
- Everything else → **essays**

---

## Frontmatter Format

The sync script generates markdown files with this frontmatter:

```yaml
---
title: "post title"
description: "short description"
publishDate: "2026-04-06"
tags: ["engineering"]
---
```

---

## Key Commands

| Command | What it does |
|---------|-------------|
| `npm run sync` | Pull latest posts from Sanity → markdown |
| `npm run dev` | Start Astro dev server (localhost:4321) |
| `npm run build` | Runs sync + builds the site |
| `git push` | Triggers Vercel deploy |

---

## Webhook (Auto-Deploy)

A webhook is set up so publishing in Sanity auto-triggers a Vercel deploy:

- **Vercel Deploy Hook:** Settings → Git → Deploy Hooks → `sanity` (branch: main)
- **Sanity Webhook:** API → Webhooks → `Deploy Vercel` (triggers on Create, Update, Delete)

---

## Deploying Sanity Studio Changes

If you update the Studio (schemas, config):

```bash
cd sandeshbhandari-studio
npx sanity deploy
```

This redeploys to `sandeshbhandari-studio.sanity.studio`.

---

## Environment Variables (Vercel)

These are set in Vercel → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `SANITY_PROJECT_ID` | `oap2klyq` |
| `SANITY_DATASET` | `production` |
| `SANITY_API_TOKEN` | your token |

---

## CORS Origins (Sanity)

Set in sanity.io/manage → API → CORS origins:

- `http://localhost:3333` (local Studio)
- `https://sandeshbhandari.net` (production domain)

---

## Troubleshooting

**Posts not showing after publish?**
→ Check Vercel Deployments — webhook should trigger a build. If not, run `npm run sync` and push manually.

**Studio not loading posts?**
→ Check CORS origins in Sanity. Add your domain if missing.

**SVGs too wide?**
→ The sync script wraps SVGs in a responsive container. If new SVGs break, check the `svgEmbed` case in `sync-sanity.mjs`.

**Port already in use?**
→ Run `npx kill-port 3333` or `npx kill-port 4321`

---

## Migration History

Migrated from Contentful to Sanity on April 15, 2026:
- 7 blog posts migrated
- All SVG diagrams preserved as svgEmbed blocks
- All images uploaded to Sanity CDN
- Rich text converted to Portable Text
- Contentful dependencies removed from package.json
