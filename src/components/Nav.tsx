"use client";

import { useSite } from "./Providers";
import { copy } from "@/lib/content";

export function Nav() {
  const { theme, toggleTheme, lang } = useSite();
  const t = copy[lang].nav;
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4 md:px-8">
        <a href="#top" className="font-display text-sm font-bold tracking-tight">
          김헌영
        </a>
        <div className="flex items-center gap-5 text-sm md:gap-8">
          <a href="#work" className="hover:text-accent">{t.work}</a>
          <a href="#about" className="hover:text-accent">{t.about}</a>
          <a href="#contact" className="hover:text-accent">{t.contact}</a>
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "밝은 테마로 전환" : "어두운 테마로 전환"}
            className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-fg hover:text-fg"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </nav>
    </header>
  );
}
