import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Post } from "@/lib/content";
import { formatDate, isoDate, slugify, withBasePath } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PostMeta({ post, className }: { post: Post; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground", className)}>
      <time dateTime={isoDate(post.date)}>{formatDate(post.date)}</time>
      <span aria-hidden>·</span>
      <span>{post.readingMinutes} min read</span>
      {post.draft && (
        <Badge variant="outline" className="border-highlight text-highlight">Draft</Badge>
      )}
    </div>
  );
}

export function TagList({ tags, className }: { tags: string[]; className?: string }) {
  if (!tags.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((t) => (
        <li key={t}>
          <Badge variant="secondary" asChild>
            <Link href={`/tags/${slugify(t)}/`}>{t}</Link>
          </Badge>
        </li>
      ))}
    </ul>
  );
}

/** Compact row: date on the left, title and description on the right. */
export function PostRow({ post }: { post: Post }) {
  return (
    <li className="group grid gap-2 py-6 sm:grid-cols-[9rem_1fr] sm:gap-8">
      <time dateTime={isoDate(post.date)} className="pt-1 font-mono text-xs text-muted-foreground">
        {formatDate(post.date, { month: "short" })}
      </time>
      <div className="min-w-0">
        <h3 className="text-xl sm:text-[1.375rem]">
          <Link href={`/posts/${post.slug}/`} className="hover:underline underline-offset-4 decoration-1 decoration-foreground/40">
            {post.title}
          </Link>
        </h3>
        {post.description && (
          <p className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-muted-foreground">
            {post.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <TagList tags={post.tags} />
          {post.draft && <Badge variant="outline" className="border-highlight text-highlight">Draft</Badge>}
        </div>
      </div>
    </li>
  );
}

/** Feature card with cover image — used for posts that carry a `cover`. */
export function PostCard({ post, horizontal = false }: { post: Post; horizontal?: boolean }) {
  const href = `/posts/${post.slug}/`;
  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden py-0 transition-colors hover:border-foreground/30",
        horizontal && "md:grid md:grid-cols-[3fr_2fr]"
      )}
    >
      {post.cover && (
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className={cn("block aspect-[3/2] overflow-hidden bg-muted", horizontal && "md:aspect-auto md:h-full")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBasePath(post.cover)}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
          />
        </Link>
      )}
      <CardContent className="flex flex-1 flex-col gap-3 p-6">
        <PostMeta post={post} />
        <h3 className="flex items-start justify-between gap-3 text-xl">
          <Link href={href} className="hover:underline underline-offset-4 decoration-1 decoration-foreground/40">
            {post.title}
          </Link>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </h3>
        {post.description && (
          <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{post.description}</p>
        )}
        <TagList tags={post.tags} className="mt-auto pt-2" />
      </CardContent>
    </Card>
  );
}
