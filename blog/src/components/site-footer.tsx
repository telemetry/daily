import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { siteConfig } from "../../site.config";
import { withBasePath } from "@/lib/format";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Separator />
        <div className="flex flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year}{" "}
            <a href={siteConfig.author.url} className="text-foreground/80 hover:text-foreground">
              {siteConfig.author.name}
            </a>
            . {siteConfig.author.bio}
          </p>
          <ul className="flex gap-4">
            {siteConfig.links.map((l) => (
              <li key={l.href}>
                {l.href.startsWith("http") ? (
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    {l.label}
                  </a>
                ) : /\.[a-z0-9]+$/i.test(l.href) ? (
                  // Files (feed.xml etc.) are not routes: plain anchor, no prefetch.
                  <a href={withBasePath(l.href)} className="hover:text-foreground">{l.label}</a>
                ) : (
                  <Link href={l.href} className="hover:text-foreground">{l.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
