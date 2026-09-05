import { ChevronRight } from "lucide-react";
import type { Heading } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/** Collapsible "On this page" list. Hidden for short posts. */
export function Toc({ headings, className }: { headings: Heading[]; className?: string }) {
  if (headings.length < 3) return null;
  return (
    <details className={cn("group max-w-(--measure) rounded-md border bg-card/60 text-sm open:pb-4", className)}>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-wider text-muted-foreground select-none marker:content-none [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" />
        On this page
        <span className="ml-auto normal-case tracking-normal">{headings.length}</span>
      </summary>
      <ol className="ml-4 space-y-1.5 border-l border-border pr-4">
        {headings.map((h) => (
          <li key={h.id} className={cn(h.depth === 3 && "pl-3")}>
            <a
              href={`#${h.id}`}
              className="-ml-px block border-l border-transparent pl-3 leading-snug text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}
