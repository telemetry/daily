import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Prose } from "@/components/prose";
import { Toc } from "@/components/toc";
import { PostMeta, TagList } from "@/components/post-list";
import { getAdjacentPosts, getAllPosts, getPost } from "@/lib/content";
import { formatDate, isoDate } from "@/lib/format";
import { siteConfig } from "../../../../site.config";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAllPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description || undefined,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description || undefined,
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [siteConfig.author.name],
      tags: post.tags,
      images: post.cover ? [{ url: post.cover, alt: post.coverAlt }] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const { newer, older } = await getAdjacentPosts(slug);

  return (
    <article className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
      <header className="max-w-3xl">
        <PostMeta post={post} />
        <h1 className="mt-4 text-4xl sm:text-6xl">{post.title}</h1>
        {post.description && (
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">{post.description}</p>
        )}
        <TagList tags={post.tags} className="mt-6" />
      </header>

      {post.cover && (
        <figure className="mt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.cover}
            alt={post.coverAlt ?? ""}
            className="w-full rounded-md bg-muted"
            fetchPriority="high"
          />
        </figure>
      )}

      <div className="mt-12 @container">
        <Toc headings={post.headings} className="mb-10" />
        <Prose html={post.html} />
      </div>

      <footer className="mt-20 max-w-3xl">
        <Separator />
        <div className="flex flex-col gap-2 py-6 font-mono text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>
            Published <time dateTime={isoDate(post.date)}>{formatDate(post.date)}</time>
            {post.updated && (
              <> · Updated <time dateTime={isoDate(post.updated)}>{formatDate(post.updated)}</time></>
            )}
          </span>
          <span>{post.words.toLocaleString(siteConfig.locale)} words</span>
        </div>
        <Separator />
        <nav aria-label="Adjacent posts" className="grid gap-6 py-8 sm:grid-cols-2">
          <div>
            {older && (
              <Link href={`/posts/${older.slug}/`} className="group block">
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground"><ArrowLeft className="size-3" /> Older</span>
                <span className="mt-1 block text-lg group-hover:underline underline-offset-4">{older.title}</span>
              </Link>
            )}
          </div>
          <div className="sm:text-right">
            {newer && (
              <Link href={`/posts/${newer.slug}/`} className="group block">
                <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground sm:justify-end">Newer <ArrowRight className="size-3" /></span>
                <span className="mt-1 block text-lg group-hover:underline underline-offset-4">{newer.title}</span>
              </Link>
            )}
          </div>
        </nav>
      </footer>
    </article>
  );
}
