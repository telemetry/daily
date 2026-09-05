/**
 * Palette registry. Each palette is a CSS file in src/styles/themes that sets
 * the shadcn/ui tokens (colours, radius) AND the type stack for that look.
 *
 * To add a palette:
 *   1. copy src/styles/themes/paper.css → src/styles/themes/<id>.css and edit
 *   2. @import it from src/app/globals.css
 *   3. add an entry below
 */
export const themes = [
  {
    id: "paper",
    name: "Paper",
    description: "Cream stock, ink type. Inclusive Sans, light and airy.",
    swatch: { light: ["#F9F6EE", "#0a131d"], dark: ["#0a131d", "#E8E4DD"] },
  },
  {
    id: "darkroom",
    name: "Darkroom",
    description: "Near-black with a safelight amber. Built for photographs.",
    swatch: { light: ["#ECE9E3", "#141312"], dark: ["#0c0c0d", "#d9d4cc"] },
  },
  {
    id: "gallery",
    name: "Gallery",
    description: "White walls, hard edges, quiet grotesk. Zero radius.",
    swatch: { light: ["#FFFFFF", "#111111"], dark: ["#121212", "#F2F2F2"] },
  },
  {
    id: "ink",
    name: "Ink",
    description: "Editorial serif. Newsreader body, Fraunces display, oxblood accent.",
    swatch: { light: ["#F4EFE6", "#1c1917"], dark: ["#15130f", "#E9E2D6"] },
  },
] as const;

export type ThemeId = (typeof themes)[number]["id"];
export const themeIds = themes.map((t) => t.id) as readonly ThemeId[];
export const PALETTE_STORAGE_KEY = "palette";

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && (themeIds as readonly string[]).includes(value);
}
