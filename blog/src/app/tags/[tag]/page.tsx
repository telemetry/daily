import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostRow } from "@/components/post-list";
import { getAllTags, getPostsByTag } from "@/lib/content";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAllTags()).map((t) => ({ tag: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tags/[tag]">): Promise<Metadata> {
  const { tag } = await params;
  const t = (await getAllTags()).find((x) => x.slug === tag);
  return t ? { title: `Tagged “${t.tag}”` } : {};
}

export default async function TagPage({ params }: PageProps<"/tags/[tag]">) {
  const { tag } = await params;
  const summary = (await getAllTags()).find((x) => x.slug === tag);
  if (!summary) notFound();
  const posts = await getPostsByTag(tag);

  return (
    <div className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
      <Link href="/tags/" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3" /> All tags
      </Link>
      <h1 className="mt-4 text-4xl sm:text-5xl">{summary.tag}</h1>
      <p className="mt-4 text-muted-foreground">{posts.length} {posts.length === 1 ? "post" : "posts"}.</p>
      <ul className="mt-10 divide-y border-t">{posts.map((p) => <PostRow key={p.slug} post={p} />)}</ul>
    </div>
  );
}
