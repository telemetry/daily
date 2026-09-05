import { getAllPosts } from "@/lib/content";
import { absoluteUrl, siteOrigin } from "@/lib/format";
import { siteConfig } from "../../../site.config";

export const dynamic = "force-static";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Make root-relative src/href absolute so images work in readers (HTML already carries BASE_PATH). */
const absolutise = (html: string) =>
  html.replace(/(src|href)="\/(?!\/)([^"]*)"/g, (_m, attr, rest) => `${attr}="${siteOrigin()}/${rest}"`);

export async function GET() {
  const posts = await getAllPosts();
  const items = posts
    .map(
      (p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${absoluteUrl(`/posts/${p.slug}/`)}</link>
      <guid isPermaLink="true">${absoluteUrl(`/posts/${p.slug}/`)}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      ${p.description ? `<description>${esc(p.description)}</description>` : ""}
      ${p.tags.map((t) => `<category>${esc(t)}</category>`).join("")}
      <content:encoded><![CDATA[${absolutise(p.html)}]]></content:encoded>
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(siteConfig.name)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${esc(siteConfig.description)}</description>
    <language>${siteConfig.locale.toLowerCase()}</language>
    <lastBuildDate>${new Date(posts[0]?.date ?? Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
