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

/** Deployed origin. SITE_URL (set by the Pages workflow) overrides site.config.ts. */
export function siteOrigin() {
  return (process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url).replace(/\/$/, "");
}

/** Prefix a root-relative path with BASE_PATH (for raw <img src> / <a href>, which Next does not rewrite). */
export function withBasePath(path: string) {
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!prefix || !path.startsWith("/") || path.startsWith("//") || path.startsWith(prefix + "/")) return path;
  return `${prefix}${path}`;
}

/** Absolute URL for a site path, honouring BASE_PATH. */
export function absoluteUrl(path: string) {
  return `${siteOrigin()}${withBasePath(path.startsWith("/") ? path : `/${path}`)}`;
}
