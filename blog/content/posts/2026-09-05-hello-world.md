---
title: "Hello, world"
date: 2026-09-05
description: "How this site works — one folder of markdown, one config file, four themes, zero servers."
tags: [meta]
---

This site is a static site generator built on [Next.js](https://nextjs.org), [shadcn/ui](https://ui.shadcn.com) and Tailwind. Every post is a markdown file in `content/posts`; `npm run build` turns the folder into plain HTML in `out/` that you can host anywhere.

## Writing

Create a post with the CLI:

```bash
npm run new "Slow shutter, fast city"
```

That writes `content/posts/2026-09-05-slow-shutter-fast-city.md` with the frontmatter filled in. Open it, write, and run `npm run dev` to preview at `http://localhost:3000`.

Frontmatter fields:

| Field         | Required | Notes                                                      |
| ------------- | -------- | ---------------------------------------------------------- |
| `title`       | yes      |                                                            |
| `date`        | yes      | `YYYY-MM-DD`. Also read from the filename prefix.          |
| `description` | no       | Shown on the index and used for `<meta description>`.      |
| `tags`        | no       | `[photography, leica]`                                     |
| `cover`       | no       | Path under `public/`. Posts with a cover get a feature card.|
| `coverAlt`    | no       | Alt text for the cover.                                    |
| `draft`       | no       | `true` hides the post from production builds.              |

## Photographs

Standalone images become figures. The *title* string is the caption, and `{.wide}` breaks a picture out of the text measure:

```md
![Brisbane River at dusk](/images/plate-01.svg "Brisbane River, 1/8s at f/8 {.wide}")
```

![Brisbane River at dusk](/images/plate-01.svg "Brisbane River, 1/8s at f/8 {.wide}")

## Themes

The palette menu in the header switches between **Paper**, **Darkroom**, **Gallery** and **Ink**, each with light and dark variants. Set the default and decide whether readers can switch in `site.config.ts`. Each theme is a single CSS file that sets the shadcn/ui tokens and the type stack, so adding a fifth is a copy-and-edit job.

## Code

Fenced code is highlighted at build time with Shiki. Add a title, highlight lines, or show line numbers:

```ts title="site.config.ts" {3} showLineNumbers
export const siteConfig = {
  name: "Telemetry",
  theme: { default: "paper", colorMode: "system", switcher: true },
};
```

That's the whole tool. Delete this post when you're ready.
