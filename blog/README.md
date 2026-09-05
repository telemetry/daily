# Blog

A branded static site generator for a personal journal. Markdown in, plain HTML out.
Built with Next.js (static export), shadcn/ui, Tailwind v4 and self-hosted type.

```
content/
  posts/      one .md file per post
  pages/      about.md → /about/ (any file here becomes a top-level page)
public/
  images/     photographs and other assets, referenced as /images/…
site.config.ts   name, tagline, author, nav, default theme
src/styles/themes/  one CSS file per palette
```

## Daily use

```bash
npm install                 # once
npm run new "Post title"    # scaffolds content/posts/YYYY-MM-DD-post-title.md
npm run dev                 # http://localhost:3000, drafts visible
npm run build               # static site in ./out
npm run preview             # serve ./out locally
```

`npm run new` accepts flags after `--`:

```bash
npm run new "Slow shutter" -- --tags photography,leica --draft --date 2026-09-05
```

## Writing posts

```md
---
title: "Slow shutter, fast city"
date: 2026-09-05
description: "One line for the index and <meta description>."
tags: [photography, leica]
cover: /images/slow-shutter.jpg      # optional — posts with a cover get a feature card
coverAlt: "Traffic trails on Ann Street"
draft: true                          # optional — hidden from production builds
---

Body in GitHub-flavoured markdown.
```

**Photographs.** A stand-alone image becomes a `<figure>`. The title string is the caption; add
`{.wide}` to break the plate out of the text measure to the full article width:

```md
![Alt text](/images/plate.jpg "Caption under the image {.wide}")
```

**Code.** Fenced blocks are highlighted at build time (Shiki, light and dark). Meta strings are
supported: ```` ```ts title="file.ts" {2,5-7} showLineNumbers ````.

**Drafts** appear in `npm run dev` and are excluded from `npm run build`. Set `SHOW_DRAFTS=1` to
include them in a build.

## Themes

Four palettes ship, each with a light and dark variant:

| id         | Type                              | Character                                  |
| ---------- | --------------------------------- | ------------------------------------------ |
| `paper`    | Inclusive Sans · IBM Plex Mono    | Cream stock, ink type. Matches the dashboard. |
| `darkroom` | Instrument Sans · JetBrains Mono  | Near-black, warm greys, safelight amber. For photographs. |
| `gallery`  | Instrument Sans · JetBrains Mono  | White walls, zero radius.                  |
| `ink`      | Newsreader · Fraunces · Plex Mono | Editorial serif, oxblood accent.           |

Set the default in `site.config.ts`:

```ts
theme: {
  default: "paper",      // palette id
  colorMode: "system",   // "light" | "dark" | "system"
  switcher: true,        // false locks the palette; readers still get light/dark
}
```

Readers' choices persist in `localStorage`; an inline script applies the saved palette before
first paint so there is no flash.

### Adding a palette

1. Copy `src/styles/themes/paper.css` to `src/styles/themes/<id>.css`.
2. Change the tokens. Colours are the standard shadcn/ui set plus `--highlight` (links, code
   highlights) and `--selection`. Type is `--font-body`, `--font-heading`, `--font-code`, plus
   `--heading-weight`, `--heading-tracking`, `--heading-leading` and `--measure`.
3. `@import` it at the bottom of the palette list in `src/app/globals.css`.
4. Add an entry (id, name, description, swatch) to `src/lib/themes.ts`.

Fonts are self-hosted via `@fontsource` packages. To use a different face, `npm i @fontsource-variable/<name>`,
import its CSS in `globals.css`, and reference the family name in your palette.

## Components

shadcn/ui components live in `src/components/ui`. `components.json` is configured, so
`npx shadcn@latest add <component>` works for adding more.

## Deploying

`npm run build` writes a self-contained site to `out/`. Upload that folder to any static host:

- **Netlify / Cloudflare Pages / Vercel** — build command `npm run build`, publish directory `out`, base directory `blog`.
- **GitHub Pages (project site)** — build with `BASE_PATH=/<repo> npm run build` and publish `out/`.
- **Your own server** — `rsync -av out/ server:/var/www/site/`.

Set `url` in `site.config.ts` to the deployed origin so canonical URLs, the RSS feed
(`/feed.xml`) and `sitemap.xml` are correct.

The `blog-build` workflow in `.github/workflows` builds on every push touching `blog/` and
uploads `out/` as an artifact, so a broken build is caught before deploy.
