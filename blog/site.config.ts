import type { ThemeId } from "./src/lib/themes";

/**
 * Everything about *your* site lives here. Edit freely.
 */
export const siteConfig = {
  /** Site name — shown in the header wordmark, <title>, and the feed. */
  name: "Telemetry",
  /** One line under the wordmark on the home page. */
  tagline: "Notes on design engineering, photography, and type.",
  /** Longer description for <meta name="description"> and the feed. */
  description:
    "A journal of design engineering, photographs, and typography by Terry Gillespie.",
  /** Absolute URL of the deployed site (no trailing slash). Used for canonical URLs, RSS and sitemap. */
  url: "https://terrygillespie.com",
  /** Content language. */
  locale: "en-AU",

  author: {
    name: "Terry Gillespie",
    /** Short bio shown on the home page and post footers. */
    bio: "Principal design engineer. Photographer. Typographer.",
    url: "https://terrygillespie.com",
    email: "",
  },

  /** Header navigation. Paths are relative to the site root. */
  nav: [
    { label: "Writing", href: "/" },
    { label: "Tags", href: "/tags/" },
    { label: "About", href: "/about/" },
  ],

  /** Footer links. */
  links: [
    { label: "GitHub", href: "https://github.com/telemetry" },
    { label: "RSS", href: "/feed.xml" },
  ],

  theme: {
    /** Default palette: "paper" | "darkroom" | "gallery" | "ink" (see src/styles/themes). */
    default: "paper" as ThemeId,
    /** Default colour mode: "light" | "dark" | "system". */
    colorMode: "system" as "light" | "dark" | "system",
    /** Let readers pick a palette from the header. Set false to lock the brand. */
    switcher: true,
  },

  /** How many posts appear on the home page before the archive link. */
  postsOnHome: 12,
  /** Words per minute used for reading-time estimates. */
  wordsPerMinute: 220,
};

export type SiteConfig = typeof siteConfig;
