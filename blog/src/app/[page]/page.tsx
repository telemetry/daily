import fs from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prose } from "@/components/prose";
import { getPage } from "@/lib/content";

export const dynamicParams = false;

/** Every content/pages/*.md becomes a top-level route: about.md → /about/ */
export async function generateStaticParams() {
  try {
    const files = await fs.readdir(path.join(process.cwd(), "content", "pages"));
    return files.filter((f) => f.endsWith(".md")).map((f) => ({ page: f.replace(/\.md$/, "") }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const { page } = await params;
  const doc = await getPage(page);
  return doc ? { title: doc.title, description: doc.description } : {};
}

export default async function MarkdownPage({ params }: PageProps<"/[page]">) {
  const { page } = await params;
  const doc = await getPage(page);
  if (!doc) notFound();
  return (
    <article className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
      <h1 className="text-4xl sm:text-6xl">{doc.title}</h1>
      {doc.description && <p className="mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">{doc.description}</p>}
      <Prose html={doc.html} className="mt-12" />
    </article>
  );
}
