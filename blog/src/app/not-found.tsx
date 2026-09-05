import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-24 sm:px-8 sm:pt-32">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="mt-4 text-5xl sm:text-7xl">Nothing here.</h1>
      <p className="mt-5 max-w-md text-lg text-muted-foreground">
        The page you were after has moved, or never existed.
      </p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/">Back to writing</Link>
      </Button>
    </div>
  );
}
