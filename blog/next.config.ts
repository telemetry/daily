import type { NextConfig } from "next";

/**
 * Static export. `next build` writes a fully static site to ./out that can be
 * served from any host (GitHub Pages, Netlify, Cloudflare Pages, S3, nginx…).
 *
 * BASE_PATH builds for a sub-directory, e.g. BASE_PATH=/blog npm run build
 * SITE_URL overrides site.config.ts `url` (the deploy workflow sets both from GitHub Pages).
 */
const basePath = process.env.BASE_PATH?.replace(/\/$/, "") || undefined;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath ?? "",
    NEXT_PUBLIC_SITE_URL: process.env.SITE_URL ?? "",
  },
};

export default nextConfig;
