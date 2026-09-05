import { siteConfig } from "../../site.config";

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(siteConfig.locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(d);
}

export function isoDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Absolute URL for a site path, honouring BASE_PATH. */
export function absoluteUrl(path: string) {
  const base = siteConfig.url.replace(/\/$/, "");
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}
