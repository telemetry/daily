"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themes, type ThemeId } from "@/lib/themes";
import { usePalette } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

function Swatch({ colors }: { colors: readonly [string, string] }) {
  return (
    <span
      aria-hidden
      className="block size-4 shrink-0 rounded-full border border-border"
      style={{
        background: `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50% 100%)`,
      }}
    />
  );
}

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { palette, setPalette, locked } = usePalette();
  // false during SSR/hydration, true once on the client — without a setState-in-effect.
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const modeIcon =
    !mounted ? <Sun className="size-4" /> : resolvedTheme === "dark" ? <Moon /> : <Sun />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Appearance">
          {locked ? modeIcon : <Palette />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mounted ? theme : undefined} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light"><Sun /> Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark"><Moon /> Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system"><Monitor /> System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {!locked && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
              Theme
            </DropdownMenuLabel>
            {themes.map((t) => {
              const active = palette === t.id;
              const dark = mounted && resolvedTheme === "dark";
              return (
                <DropdownMenuItem
                  key={t.id}
                  onSelect={() => setPalette(t.id as ThemeId)}
                  className={cn("items-start gap-3 py-2", active && "bg-accent/60")}
                >
                  <span className="mt-0.5"><Swatch colors={dark ? t.swatch.dark : t.swatch.light} /></span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center justify-between">
                      <span className="font-medium">{t.name}</span>
                      {active && <Check className="size-3.5 text-foreground" />}
                    </span>
                    <span className="text-xs leading-snug text-muted-foreground">{t.description}</span>
                  </span>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
