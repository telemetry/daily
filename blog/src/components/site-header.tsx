import Link from "next/link";
import { siteConfig } from "../../site.config";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="wordmark text-lg leading-none">
          {siteConfig.name}
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
}
