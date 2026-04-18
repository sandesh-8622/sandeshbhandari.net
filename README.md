# how i built sandeshbhandari.net

a personal site i actually built, not bought
2026 April 18
·
15 min read
`astro` `sanity` `typescript` `tailwind`

so i got tired of linkedin being my entire online presence. one day i just decided i wanted something that was actually mine - a place to write, to show off photos, to list projects without having to compete with "5 reasons why you should hire a developer" slop in the linkedin feed. what i ended up with is this: an astro site with a sanity cms, a photography gallery, some keyboard shortcuts that nobody asked for, and a snoopy mascot.

here's how all of it fits together.

## why does this exist?

the honest answer is that i'm a CS student applying for internships and everyone said "you need a portfolio." but every portfolio template i saw was the same - hero section with a big photo, a skills grid with icons, a contact form nobody uses. i wanted something that felt like me, not like a template.

also i wanted to blog. not because i think my thoughts are particularly profound, but because writing forces me to think clearly about things. i can write about the rust book i'm reading, the cologne phase i went through in high school, or a NEAT algorithm i implemented for a self-driving car simulation. no pressure, no algorithm feeding it to strangers, just a place where interested people can click around.

the photography section exists because i take a lot of photos on my phone and they were dying in my camera roll. pheasants, statues at the louvre, beaches, the ponte 25 de abril in lisbon. felt like a waste not to put them somewhere.

## the stack

- **astro 6** with the cactus theme as a starting point, heavily customized
- **sanity** as the CMS for blog posts (migrated from contentful)
- **typescript** everywhere because i'm not writing plain js in 2026
- **tailwind 4** for styling
- **vercel** for hosting, with a webhook from sanity so publishing auto-deploys
- **namecheap** for the domain
- **github** for version control, with a clean commit history that actually tells a story

i picked astro because it outputs static HTML by default. that means fast page loads, low hosting costs, and no runtime surprises. react components only ship js when they actually need interactivity, and most of my site doesn't need interactivity at all. why would a blog post need 200kb of react hydration code? astro solves this with islands architecture - you pick which components get client-side js, everything else is just HTML.

sanity was a trade-off. contentful had a 1-locale, 5-user limit on the free tier and their editor UX was clunky. sanity studio is fully customizable (it's literally a react app you deploy yourself) and has a better free tier. i set up a webhook so that publishing in sanity triggers a vercel build automatically. write a post, hit publish, site updates in ~90 seconds without me touching the repo.

```
site visitor      ←  vercel (static files)  ←  github
                                                 ↑
                                            my laptop

sanity studio  →  webhook  →  vercel rebuild
```

## the content pipeline

blog posts live in sanity as rich text documents. when vercel builds the site, a sync script pulls them down, converts the portable text format into markdown, and drops them into `src/content/post/`. astro content collections then pick them up and generate the pages.

```js
// scripts/sync-sanity.mjs (simplified)
const posts = await sanityClient.fetch(`*[_type == "post"]{
  title, slug, publishDate, body, tags
}`)

for (const post of posts) {
  const markdown = portableTextToMarkdown(post.body)
  const frontmatter = `---
title: "${post.title}"
publishDate: "${post.publishDate}"
tags: ${JSON.stringify(post.tags)}
---`
  fs.writeFileSync(
    `src/content/post/${post.slug}.md`,
    `${frontmatter}\n\n${markdown}`
  )
}
```

the tricky part was embedded content - SVGs, code blocks, images. i wrote a custom serializer that wraps SVGs in a responsive container so they don't overflow on mobile, extracts code block language hints, and handles sanity's image CDN URLs. took a weekend to get right. the first version had all SVGs exploding to 2000px wide on mobile and i genuinely couldn't figure out why for three hours.

photos are different. they live as markdown files with frontmatter in `src/content/photography/`, each one pointing to an image URL. i thought about putting photos in sanity too but they don't change often enough to justify the pipeline, and keeping them in git means the photo order is version-controlled.

## homepage

the homepage merges what would normally be an "about" page with a dashboard of recent activity. it says hi, explains who i am in two paragraphs, shows three recent blog posts, six recent photos, and all four work projects. each section header is clickable and links to the full archive.

one design decision worth mentioning: the "more →" link sits below each section on its own line, right-aligned. i initially put it inline with the section heading but that made it ambiguous - does "more" belong to the section title or the last post? below-and-right feels like a natural conclusion to a section. small thing but it bugged me until i moved it.

the hobby links in the bio paragraph go to my actual accounts - chess (lichess), music (spotify), books (goodreads), films (letterboxd), instagram, vsco. real links to real profiles. no fake "i love music" with nothing to back it up.

## keyboard shortcuts

this is the part i'm most annoyed with myself about, and also the part i'm most proud of.

i use the keyboard constantly. when i'm browsing my own site i don't want to reach for the mouse to click "blog." so i added vim-style shortcuts. press `g` then a section key: `a` for about (home), `b` for blog, `p` for photography, `w` for work. `gg` scrolls to top. `escape` goes back - from an article to its list, from a list to home.

```ts
// prefix handling
if (e.key === "g" && !gPending) {
  gPending = true
  gTimer = setTimeout(() => { gPending = false }, 1000)
  return
}

if (gPending) {
  clearTimeout(gTimer)
  gPending = false
  const match = NAV.find(s => s.key === e.key)
  if (match) {
    window.location.href = match.path
    return
  }
}
```

a 1-second timeout on the `g` prefix - if you press `g` and then get distracted, it resets. shortcut config is in one file so adding a new section is one line.

### list navigation

on pages that show lists of posts, photos, or projects, `j` moves down and `k` moves up. `enter` opens the focused item. the implementation finds every `<li>` inside every `<ul>` in `<main>`, skipping flex lists (those are usually horizontal tag lists, not vertical content lists).

```ts
function getListItems() {
  const lists = document.querySelectorAll("main ul")
  const items = []
  for (const list of lists) {
    if (getComputedStyle(list).display.startsWith("flex")) continue
    items.push(...Array.from(list.children).filter(el => el.tagName === "LI"))
  }
  return items
}
```

when you press `j`, the selected item gets a `vim-focus` class (2px outlined border) and scrolls to the center of the viewport with `scrollIntoView({ block: "center", behavior: "smooth" })`. centering is better than `nearest` because you don't end up with the focused item hovering near the bottom of the screen where it's harder to read.

there's an `enter` handler that explicitly reads the current focus index and navigates to that link. i initially relied on the browser's native focus + enter behavior, but there was a bug where stale browser focus from earlier could fire on the wrong item. explicit handler fixed it.

### photo detail pages

on individual photo pages, the left and right arrow keys jump to the previous and next photo. this isn't a vim thing - it's just the universal pattern from every photo viewer on earth (google photos, apple photos, instagram). the implementation queries `a[rel="prev"]` and `a[rel="next"]` and navigates to their hrefs.

```ts
if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
  const rel = e.key === "ArrowLeft" ? "prev" : "next"
  const link = document.querySelector(`a[rel="${rel}"]`)
  if (link) window.location.href = link.href
}
```

### the hud

bottom-right corner, there's a small badge that shows your keypresses in real time. it combines `g` + key into `g → b` with an arrow. hidden on mobile because phones don't have keyboards.

nobody asked for any of this. it's pure self-indulgence. but using this site is genuinely more pleasant because of it and i don't want it any other way.

## theme system

three modes: system, light, dark. the button cycles through them - monitor icon for system, sun for light, moon for dark. on mobile, the monitor icon swaps for a phone icon because your phone isn't a monitor.

```css
@media (max-width: 767px) {
  .theme-icon-mobile { display: block; }
  .theme-icon-desktop { display: none; }
}
```

system mode follows `prefers-color-scheme` and subscribes to changes, so if you flip your OS from light to dark at 8pm, the site follows along without a refresh. the mode choice gets saved to localStorage under `theme-mode`.

i debated removing the toggle entirely and just using system preference, but three-mode toggles are the pattern i personally expect on every site now. so i kept it.

## photography

the gallery uses CSS columns for masonry layout. three columns on desktop, two on mobile. no javascript, no layout calculation, the browser handles everything. i tried a few masonry libraries first and they all had some edge case - images being reordered, jumping layouts on resize, not working with server-side rendering. CSS columns just work.

```css
.masonry {
  columns: 3;
  column-gap: 0.625rem;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 0.625rem;
}
```

there's one tricky bit. when the page loads, the first six images get `loading="eager"` and everything else is `loading="lazy"`. reason: i found there was a "reflow flash" where the browser initially rendered images at natural size, computed the masonry layout, then re-computed as lazy images loaded in, causing items below to jump around for a split second. eager-loading the top 6 (what's visible above the fold) eliminates the flash. images also get a `min-height: 200px` and a subtle gray background so they reserve space before loading.

the individual photo pages have a `← prev` / `next →` navigation that ties into the arrow key shortcut. dates are shown with a custom format ("oct 5, 2024") because ISO dates in a gallery are ugly.

## blog

each post gets a reading progress bar at the top. a 2px accent-colored line that fills horizontally as you scroll. passive scroll listener with `requestAnimationFrame` so it doesn't block the main thread:

```ts
let rafId = null
window.addEventListener("scroll", () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    const pct = (scrollTop / (scrollHeight - clientHeight)) * 100
    bar.style.width = `${pct}%`
    rafId = null
  })
}, { passive: true })
```

posts are auto-categorized as "engineering" or "essays" based on title and tag keywords. stuff about rust, python, docker, APIs, algorithms → engineering. everything else → essays. it's a dumb heuristic but it matches my actual posts pretty well.

the `[` and `]` keys jump to the previous and next heading. `1` through `9` jump to the nth heading. this lets you skim a long article without scrolling. `1-9` wraps so `9` always goes to the last heading, same logic as ctrl+9 jumping to your last browser tab.

## work

four projects, each in its own card. subtitle (organization/context), title (what i did), tags (tools i used), description, and "check out →" link if there's something external to see. when you click anywhere on a card with an external link, it opens that link in a new tab. cards without links (like my video editor work or the CFC volunteering) just display the info.

the entire card-is-one-link pattern was a bug fix. originally i had the card content as one link and the "check out →" as a second link. `j/k` navigation would focus the first link but `enter` would sometimes fire on the second link because of stale browser focus. collapsing everything into one link per card removed the ambiguity.

## favicon

a snoopy-themed avatar drew my attention. the challenge was getting it to work as a favicon - the original source was a 1024x1024 PNG with a solid black background, and i wanted it transparent so it looked good in both light and dark browser tabs. i tried programmatic transparency removal (making near-black pixels transparent) but the character's face and body were also filled with black, so the "remove black" algorithm destroyed the subject along with the background.

eventually i exported a properly transparent version from a real image editor (not my flawed python script) and used that. multiple sizes - 16, 32, 48, 180 (apple touch), 192, 512 - so every platform gets a crisp icon.

## deployment

push to main on github → vercel sees the push via webhook → runs `npm run sync && npm run build` → deploys. the whole pipeline takes about 90 seconds. sanity publishing triggers the same pipeline via a vercel deploy hook, so publishing content works the same as pushing code.

environment variables in vercel:
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_TOKEN`

that's it. no AWS, no docker, no kubernetes, no terraform. for a personal site, all of that is overkill. vercel's free tier handles the traffic a personal site is ever going to get, and the deployment UX is so good it makes me slightly worried about what i'll do when i eventually have to use something less polished.

### the domain

sandeshbhandari.net is on namecheap. apex domain points to vercel via an A record (`216.198.79.1`), www is a CNAME that 308-redirects to the apex. i picked apex-as-canonical because `sandeshbhandari.net` is shorter than `www.sandeshbhandari.net` and www is an outdated convention. nobody types www in 2026 unless they're my grandparents.

SSL is automatic via vercel. they issue and renew let's encrypt certificates behind the scenes and i never think about it.

## the social card

when you share a link to the site on linkedin or twitter, the preview used to say "astro cactus by chris williams" with a cactus logo, because that's what the default social-card.png in the astro cactus theme was. linkedin aggressively caches this, so even after i pushed a new theme the previews still showed the template defaults for weeks.

i built a custom 1200x630 card with python and Pillow - my avatar on the left, my name and tagline on the right, dark theme with a mint accent color matching the site. forced linkedin to re-scrape using their post inspector tool. now sharing the site actually looks like me.

## the repo structure

```
src/
├── components/
│   ├── VimShortcuts.astro    # all the keyboard magic
│   ├── ThemeToggle.astro     # 3-mode theme cycler
│   ├── ThemeProvider.astro   # reads localStorage, applies theme
│   ├── SocialList.astro      # github, linkedin, goodreads, email
│   └── layout/
│       ├── Header.astro      # nav with shortcut hints
│       └── Footer.astro
├── content/
│   ├── post/*.md             # synced from sanity
│   └── photography/*.md      # photos with metadata
├── layouts/
│   ├── Base.astro            # wraps every page
│   └── BlogPost.astro        # reading progress + TOC
├── pages/
│   ├── index.astro           # homepage
│   ├── posts/[...slug].astro
│   ├── photography/[...slug].astro
│   └── work.astro
└── data/
    └── shortcuts.ts           # NAV_SHORTCUTS config

scripts/
└── sync-sanity.mjs           # sanity → markdown sync
```

## what i'd do differently

i over-engineered the keyboard shortcuts. they work great but they took a disproportionate amount of time for something most visitors will never use. if i was starting over i'd build the core site first, get it deployed, and add shortcuts as a v2 feature.

the contentful → sanity migration was a mistake in retrospect. contentful's limits were annoying but not blocking. sanity is better but the migration cost me a weekend. sometimes the grass is only slightly greener.

i should have set up the domain before spending a day polishing the site. i kept testing on localhost and vercel.app previews and when i finally pointed sandeshbhandari.net at vercel i realized the social card was wrong, the og:title was "about", and my favicon was cached as the old theme's cactus logo in every browser i'd used during development. some of this would have been caught earlier if i'd been on the real domain from day one.

## closing

this site is built to be exactly what i want and nothing more. it's where i write, where i show photos, where i list work i'm proud of. the tech choices are boring on purpose - i'd rather spend time writing than debugging infrastructure.

if you've read this far, you now know more about this site than most people who visit it. go press some keys. `g` then `b` for blog, `g` then `p` for photography, `ctrl + /` for the full shortcut list. you've earned it.

---

built with [astro](https://astro.build), [sanity](https://sanity.io), and too much coffee

source: [github.com/sandesh-8622/sandeshbhandari.net](https://github.com/sandesh-8622/sandeshbhandari.net)
