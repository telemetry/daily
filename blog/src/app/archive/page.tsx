import type { Metadata } from "next";
import { PostRow } from "@/components/post-list";
import { getAllPosts, groupByYear } from "@/lib/content";

export const metadata: Metadata = { title: "Archive", description: "Every post, by year." };

export default async function ArchivePage() {
  const groups = groupByYear(await getAllPosts());
  return (
    <div className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
      <h1 className="text-4xl sm:text-5xl">Archive</h1>
      {groups.map(([year, posts]) => (
        <section key={year} className="mt-14">
          <h2 className="border-b pb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">{year}</h2>
          <ul className="divide-y">{posts.map((p) => <PostRow key={p.slug} post={p} />)}</ul>
        </section>
      ))}
    </div>
  );
}
