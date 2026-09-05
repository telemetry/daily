import Link from "next/link";
import { ArrowRight, Rss } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard, PostRow } from "@/components/post-list";
import { getAllPosts } from "@/lib/content";
import { siteConfig } from "../../site.config";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const posts = await getAllPosts();
  const featured = posts.filter((p) => p.cover).slice(0, 2);
  const featuredSlugs = new Set(featured.map((p) => p.slug));
  const rest = posts.filter((p) => !featuredSlugs.has(p.slug)).slice(0, siteConfig.postsOnHome);
  const hasMore = posts.length > featured.length + rest.length;

  return (
    <div className="mx-auto max-w-5xl px-5 sm:px-8">
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20">
        <h1 className="text-5xl sm:text-7xl">{siteConfig.name}</h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">{siteConfig.tagline}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/about/">About {siteConfig.author.name.split(" ")[0]}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/feed.xml`}>
              <Rss /> Subscribe
            </a>
          </Button>
        </div>
      </section>

      {featured.length > 0 && (
        <section aria-label="Featured" className={cn("mb-16 grid gap-6", featured.length > 1 && "sm:grid-cols-2")}>
          {featured.map((p) => <PostCard key={p.slug} post={p} horizontal={featured.length === 1} />)}
        </section>
      )}

      <section aria-label="Writing">
        <div className="flex items-baseline justify-between border-b pb-3">
          <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Writing</h2>
          <span className="font-mono text-xs text-muted-foreground">{posts.length} posts</span>
        </div>
        {rest.length === 0 && featured.length === 0 ? (
          <p className="py-16 text-muted-foreground">
            No posts yet. Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">npm run new &quot;Hello&quot;</code> to write the first one.
          </p>
        ) : (
          <ul className="divide-y">
            {rest.map((p) => <PostRow key={p.slug} post={p} />)}
          </ul>
        )}
        {hasMore && (
          <div className="pt-8">
            <Button asChild variant="link" className="px-0">
              <Link href="/archive/">All posts <ArrowRight /></Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
