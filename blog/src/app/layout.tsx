import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "../../site.config";
import { PaletteScript, ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  alternates: {
    types: { "application/rss+xml": `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/feed.xml` },
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    locale: siteConfig.locale.replace("-", "_"),
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { theme } = siteConfig;
  return (
    <html lang={siteConfig.locale} data-theme={theme.default} suppressHydrationWarning className="h-full">
      <head>
        <PaletteScript defaultPalette={theme.default} enabled={theme.switcher} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          defaultPalette={theme.default}
          defaultColorMode={theme.colorMode}
          switcher={theme.switcher}
        >
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
