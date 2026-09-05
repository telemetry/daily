import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAllTags } from "@/lib/content";

export const metadata: Metadata = { title: "Tags", description: "Posts by topic." };

export default async function TagsPage() {
  const tags = await getAllTags();
  return (
    <div className="mx-auto max-w-5xl px-5 pt-16 sm:px-8 sm:pt-24">
      <h1 className="text-4xl sm:text-5xl">Tags</h1>
      <p className="mt-4 text-muted-foreground">{tags.length} topics.</p>
      <ul className="mt-10 flex flex-wrap gap-2">
        {tags.map((t) => (
          <li key={t.slug}>
            <Badge variant="outline" asChild className="px-3 py-1.5 text-sm">
              <Link href={`/tags/${t.slug}/`}>
                {t.tag} <span className="font-mono text-muted-foreground">{t.count}</span>
              </Link>
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
