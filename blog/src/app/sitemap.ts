import type { MetadataRoute } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import { getAllPosts, getAllTags } from "@/lib/content";
import { absoluteUrl } from "@/lib/format";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const tags = await getAllTags();
  let pages: string[] = [];
  try {
    pages = (await fs.readdir(path.join(process.cwd(), "content", "pages")))
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""));
  } catch {}

  return [
    { url: absoluteUrl("/"), lastModified: posts[0]?.date, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/archive/"), changeFrequency: "weekly", priority: 0.6 },
    { url: absoluteUrl("/tags/"), changeFrequency: "weekly", priority: 0.4 },
    ...pages.map((p) => ({ url: absoluteUrl(`/${p}/`), priority: 0.6 })),
    ...posts.map((p) => ({
      url: absoluteUrl(`/posts/${p.slug}/`),
      lastModified: p.updated ?? p.date,
      priority: 0.8,
    })),
    ...tags.map((t) => ({ url: absoluteUrl(`/tags/${t.slug}/`), priority: 0.3 })),
  ];
}
