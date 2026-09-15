"use client";

import { useSite } from "./Providers";
import { copy } from "@/lib/content";
import { Magnetic } from "./Magnetic";
import { playThemeWipe } from "@/components/fx/ThemeWipe";

export function Nav() {
  const { theme, toggleTheme, lang } = useSite();
  const t = copy[lang].nav;
  return (
    <header className="fixed inset-x-0 top-0 z-40 mix-blend-difference text-[#e6edeb]">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-5 md:px-10">
        <a href="#top" className="font-display text-sm font-bold tracking-tight" data-hover>
          HY
        </a>
        <div className="flex items-center gap-3 text-[13px] sm:gap-5 sm:text-sm md:gap-8">
          <Magnetic><a href="#work" data-hover>{t.work}</a></Magnetic>
          <Magnetic><a href="#play" data-hover className="hidden sm:inline">놀이터</a></Magnetic>
          <Magnetic><a href="#about" data-hover>{t.about}</a></Magnetic>
          <Magnetic><a href="#timeline" data-hover className="hidden sm:inline">지나온 길</a></Magnetic>
          <Magnetic><a href="#contact" data-hover>{t.contact}</a></Magnetic>
          <span className="h-4 w-px bg-current opacity-30" aria-hidden />
          <Magnetic>
            <button
              onClick={(e) => {
                const next = theme === "dark" ? "light" : "dark";
                // 키보드로 누르면 clientX가 0이라 버튼 중심을 쓴다. 와이프를 먼저 걸어야 옛 배경이 덮인다.
                const r = e.currentTarget.getBoundingClientRect();
                playThemeWipe(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2, next);
                toggleTheme();
              }}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              data-hover
              className="relative h-5 w-5"
            >
              <span
                className="absolute inset-0 rounded-full border border-current transition-transform duration-500"
                style={{ transform: theme === "dark" ? "scale(1)" : "scale(0.55)" }}
              />
              <span
                className="absolute inset-[5px] rounded-full bg-current transition-transform duration-500"
                style={{ transform: theme === "dark" ? "scale(0)" : "scale(1)" }}
              />
            </button>
          </Magnetic>
        </div>
      </nav>
    </header>
  );
}
