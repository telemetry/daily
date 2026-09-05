import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { renderMarkdown, type Heading } from "./markdown";
import { slugify } from "./format";
import { siteConfig } from "../../site.config";

const CONTENT_DIR = path.join(process.cwd(), "content");
const POSTS_DIR = path.join(CONTENT_DIR, "posts");
const PAGES_DIR = path.join(CONTENT_DIR, "pages");

export type Frontmatter = {
  title: string;
  date: string;
  updated?: string;
  description?: string;
  tags?: string[];
  cover?: string;
  coverAlt?: string;
  draft?: boolean;
  slug?: string;
};

export type Post = {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  description: string;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  draft: boolean;
  readingMinutes: number;
  words: number;
  html: string;
  headings: Heading[];
  file: string;
};

export type Page = {
  slug: string;
  title: string;
  description?: string;
  html: string;
  headings: Heading[];
};

const showDrafts = process.env.NODE_ENV !== "production" || process.env.SHOW_DRAFTS === "1";

/** `2026-09-05-my-post.md` → { date: "2026-09-05", slug: "my-post" } */
function parseFilename(file: string) {
  const base = file.replace(/\.(md|markdown)$/i, "");
  const m = base.match(/^(\d{4}-\d{2}-\d{2})[-_]?(.*)$/);
  return m ? { date: m[1], slug: m[2] || base } : { date: undefined, slug: base };
}

function normaliseTags(tags: unknown): string[] {
  if (!tags) return [];
  const list = Array.isArray(tags) ? tags : String(tags).split(",");
  return Array.from(new Set(list.map((t) => String(t).trim()).filter(Boolean)));
}

async function readPostFile(file: string): Promise<Post> {
  const raw = await fs.readFile(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(raw);
  const fm = data as Frontmatter;
  const fromName = parseFilename(file);

  const date = fm.date ? new Date(fm.date) : fromName.date ? new Date(fromName.date) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`content/posts/${file}: missing or invalid "date" (use YYYY-MM-DD)`);
  }
  if (!fm.title) throw new Error(`content/posts/${file}: missing "title"`);

  const { html, headings } = await renderMarkdown(content);
  const rt = readingTime(content, { wordsPerMinute: siteConfig.wordsPerMinute });

  return {
    slug: slugify(fm.slug ?? fromName.slug),
    title: fm.title,
    date: date.toISOString(),
    updated: fm.updated ? new Date(fm.updated).toISOString() : undefined,
    description: fm.description ?? "",
    tags: normaliseTags(fm.tags),
    cover: fm.cover,
    coverAlt: fm.coverAlt,
    draft: Boolean(fm.draft),
    readingMinutes: Math.max(1, Math.round(rt.minutes)),
    words: rt.words,
    html,
    headings,
    file,
  };
}

let postsCache: Promise<Post[]> | null = null;

export function getAllPosts(): Promise<Post[]> {
  if (!postsCache) {
    postsCache = (async () => {
      let files: string[] = [];
      try {
        files = (await fs.readdir(POSTS_DIR)).filter((f) => /\.(md|markdown)$/i.test(f));
      } catch {
        return [];
      }
      const posts = await Promise.all(files.map(readPostFile));
      const seen = new Map<string, string>();
      for (const p of posts) {
        const dup = seen.get(p.slug);
        if (dup) throw new Error(`Duplicate slug "${p.slug}" in ${dup} and ${p.file}`);
        seen.set(p.slug, p.file);
      }
      return posts
        .filter((p) => showDrafts || !p.draft)
        .sort((a, b) => b.date.localeCompare(a.date));
    })();
  }
  return postsCache;
}

export async function getPost(slug: string) {
  return (await getAllPosts()).find((p) => p.slug === slug) ?? null;
}

export async function getAdjacentPosts(slug: string) {
  const posts = await getAllPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  return {
    newer: i > 0 ? posts[i - 1] : null,
    older: i >= 0 && i < posts.length - 1 ? posts[i + 1] : null,
  };
}

export type TagSummary = { tag: string; slug: string; count: number };

export async function getAllTags(): Promise<TagSummary[]> {
  const posts = await getAllPosts();
  const counts = new Map<string, TagSummary>();
  for (const p of posts) {
    for (const tag of p.tags) {
      const slug = slugify(tag);
      const cur = counts.get(slug);
      if (cur) cur.count += 1;
      else counts.set(slug, { tag, slug, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPostsByTag(tagSlug: string) {
  return (await getAllPosts()).filter((p) => p.tags.some((t) => slugify(t) === tagSlug));
}

export async function getPage(slug: string): Promise<Page | null> {
  try {
    const raw = await fs.readFile(path.join(PAGES_DIR, `${slug}.md`), "utf8");
    const { data, content } = matter(raw);
    const { html, headings } = await renderMarkdown(content);
    return {
      slug,
      title: (data.title as string) ?? slug,
      description: data.description as string | undefined,
      html,
      headings,
    };
  } catch {
    return null;
  }
}

export function groupByYear(posts: Post[]) {
  const groups = new Map<string, Post[]>();
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    groups.set(y, [...(groups.get(y) ?? []), p]);
  }
  return [...groups.entries()];
}
