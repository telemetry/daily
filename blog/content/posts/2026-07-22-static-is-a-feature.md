---
title: "Static is a feature"
date: 2026-07-22
description: "A personal site should outlive its hosting. Plain HTML in a folder is the only format that does."
tags: [design, meta]
draft: true
---

This one is a draft. It shows up in `npm run dev` and disappears in `npm run build`, unless you set `SHOW_DRAFTS=1`.

## The argument

- A folder of HTML can be served by anything, for free, forever.
- Build-time rendering means there is nothing to patch on a Tuesday night.
- Markdown files are readable in any editor, including the one you'll be using in twenty years.

## The trade

You give up comments, search, and anything that needs a database. All three have static-friendly answers (Giscus, Pagefind, a JSON index) if you ever miss them.
