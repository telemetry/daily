#!/usr/bin/env tsx
/**
 * Scaffold a new post.
 *   npm run new "Post title"
 *   npm run new "Post title" -- --tags photography,leica --draft --date 2026-09-05
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flags: Record<string, string | boolean> = {};
const positional: string[] = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a.startsWith("--")) {
    const key = a.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith("--")) { flags[key] = next; i++; } else flags[key] = true;
  } else positional.push(a);
}

const title = positional.join(" ").trim();
if (!title) {
  console.error('Usage: npm run new "Post title" [-- --tags a,b --draft --date YYYY-MM-DD]');
  process.exit(1);
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const date = typeof flags.date === "string" ? flags.date : new Date().toISOString().slice(0, 10);
const slug = slugify(title);
const tags = typeof flags.tags === "string" ? flags.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
const dir = path.join(process.cwd(), "content", "posts");
const file = path.join(dir, `${date}-${slug}.md`);

if (fs.existsSync(file)) {
  console.error(`Already exists: ${path.relative(process.cwd(), file)}`);
  process.exit(1);
}

const fm = [
  "---",
  `title: ${JSON.stringify(title)}`,
  `date: ${date}`,
  `description: ""`,
  `tags: [${tags.join(", ")}]`,
  flags.draft ? "draft: true" : null,
  "---",
  "",
  "",
].filter((l) => l !== null).join("\n");

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(file, fm);
console.log(`Created ${path.relative(process.cwd(), file)}`);
