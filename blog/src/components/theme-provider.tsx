"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { isThemeId, PALETTE_STORAGE_KEY, type ThemeId } from "@/lib/themes";

type PaletteContextValue = {
  palette: ThemeId;
  setPalette: (id: ThemeId) => void;
  locked: boolean;
};

const PaletteContext = React.createContext<PaletteContextValue | null>(null);

export function usePalette() {
  const ctx = React.useContext(PaletteContext);
  if (!ctx) throw new Error("usePalette must be used within <ThemeProvider>");
  return ctx;
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readStoredPalette(fallback: ThemeId): ThemeId {
  try {
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    return isThemeId(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

export function ThemeProvider({
  children,
  defaultPalette,
  defaultColorMode,
  switcher,
}: {
  children: React.ReactNode;
  defaultPalette: ThemeId;
  defaultColorMode: "light" | "dark" | "system";
  switcher: boolean;
}) {
  // localStorage is the source of truth on the client; the server renders the default.
  // (The inline <script> in <head> has already applied the stored value to <html>.)
  const palette = React.useSyncExternalStore(
    subscribe,
    () => (switcher ? readStoredPalette(defaultPalette) : defaultPalette),
    () => defaultPalette
  );

  const setPalette = React.useCallback(
    (id: ThemeId) => {
      document.documentElement.setAttribute("data-theme", id);
      try {
        if (id === defaultPalette) window.localStorage.removeItem(PALETTE_STORAGE_KEY);
        else window.localStorage.setItem(PALETTE_STORAGE_KEY, id);
      } catch {}
      listeners.forEach((l) => l());
    },
    [defaultPalette]
  );

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultColorMode}
      enableSystem
      disableTransitionOnChange
    >
      <PaletteContext.Provider value={{ palette, setPalette, locked: !switcher }}>
        {children}
      </PaletteContext.Provider>
    </NextThemesProvider>
  );
}

/**
 * Applies the saved palette before first paint so there is no flash.
 * Rendered inside <head>; must stay a self-contained string.
 */
export function PaletteScript({ defaultPalette, enabled }: { defaultPalette: ThemeId; enabled: boolean }) {
  if (!enabled) return null;
  const js = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    PALETTE_STORAGE_KEY
  )});if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;
  void defaultPalette;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
