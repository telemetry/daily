import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import { toString } from "hast-util-to-string";
import type { Root, Element, ElementContent } from "hast";

export type Heading = { depth: number; id: string; text: string };

/**
 * Wrap stand-alone images in <figure>, using the markdown *title* as caption:
 *   ![alt text](/images/photo.jpg "Caption shown under the image")
 * Append {.wide} to the caption to break the image out of the text measure:
 *   ![alt](/images/photo.jpg "Leica M6, Portra 400 {.wide}")
 */
function rehypeFigures() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "p" || !parent || index === undefined) return;
      const kids = node.children.filter(
        (c) => !(c.type === "text" && c.value.trim() === "")
      );
      if (kids.length !== 1) return;
      const img = kids[0];
      if (img.type !== "element" || img.tagName !== "img") return;

      let caption = typeof img.properties?.title === "string" ? img.properties.title : "";
      const classes: string[] = [];
      caption = caption.replace(/\{\.([a-z-]+)\}/g, (_, c: string) => {
        classes.push(c);
        return "";
      }).trim();
      img.properties = { ...img.properties, loading: "lazy", decoding: "async" };
      delete img.properties.title;

      const children: ElementContent[] = [img];
      if (caption) {
        children.push({
          type: "element",
          tagName: "figcaption",
          properties: {},
          children: [{ type: "text", value: caption }],
        });
      }
      const figure: Element = {
        type: "element",
        tagName: "figure",
        properties: classes.length ? { className: [...classes] } : {},
        children,
      };
      (parent as Element).children[index] = figure;
    });
  };
}

/** External links open in a new tab, safely. */
function rehypeExternalLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties?.href;
      if (typeof href === "string" && /^https?:\/\//.test(href)) {
        node.properties.target = "_blank";
        node.properties.rel = ["noopener", "noreferrer"];
      }
    });
  };
}

/** Collect h2/h3 for a table of contents. */
function rehypeCollectHeadings(out: Heading[]) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!/^h[23]$/.test(node.tagName)) return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      out.push({ depth: Number(node.tagName[1]), id, text: toString(node) });
    });
  };
}

export async function renderMarkdown(markdown: string) {
  const headings: Heading[] = [];
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings(headings))
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["heading-anchor"] },
    })
    .use(rehypeFigures)
    .use(rehypeExternalLinks)
    .use(rehypePrettyCode, {
      theme: { light: "vitesse-light", dark: "vitesse-dark" },
      keepBackground: false,
      defaultLang: "plaintext",
    })
    .use(rehypeStringify)
    .process(markdown);

  return { html: String(file), headings };
}
