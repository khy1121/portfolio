"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSite } from "../Providers";
import { resume, sections } from "@/lib/content";

/* 데스크톱: 왼쪽에 고정된 이름·메뉴·링크. 모바일: 상단 바와 가로 스크롤 메뉴.
   보고 있는 섹션을 IntersectionObserver로 찾아 메뉴에 표시한다. */
function useActiveSection() {
  const [active, setActive] = useState<string>("");
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

function ThemeButton() {
  const { theme, toggleTheme } = useSite();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "밝은 테마로 전환" : "어두운 테마로 전환"}
      className="font-mono rounded border border-line px-2.5 py-1 text-xs text-muted hover:border-fg hover:text-fg"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

export function Sidebar() {
  const active = useActiveSection();

  return (
    <>
      {/* 모바일 상단 바 */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <a href="#top" className="font-mono text-sm font-semibold">
            {resume.name}
          </a>
          <ThemeButton />
        </div>
        <nav className="flex gap-5 overflow-x-auto px-4 pb-3 text-xs" aria-label="섹션">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`font-mono shrink-0 ${active === s.id ? "text-accent" : "text-muted"}`}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      {/* 데스크톱 사이드바 */}
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-line px-8 py-12 lg:flex">
        <div>
          <a href="#top" className="block">
            <span className="font-mono text-xs text-accent">{resume.title}</span>
            <span className="mt-2 block text-2xl font-bold">{resume.name}</span>
          </a>
          <nav className="mt-12" aria-label="섹션">
            <ol className="space-y-3">
              {sections.map((s, i) => {
                const on = active === s.id;
                return (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className={`font-mono group flex items-center gap-3 text-sm ${on ? "text-fg" : "text-muted hover:text-fg"}`}>
                      <span className={`text-xs tabular-nums ${on ? "text-accent" : ""}`}>{String(i + 1).padStart(2, "0")}</span>
                      <span className={`h-px transition-all ${on ? "w-8 bg-accent" : "w-4 bg-line group-hover:w-8"}`} aria-hidden />
                      {s.label}
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="space-y-4 text-sm">
          <ul className="font-mono space-y-2 text-muted">
            <li>
              <a href={resume.github} target="_blank" rel="noreferrer" className="hover:text-accent">GitHub ↗</a>
            </li>
            <li>
              <a href={`mailto:${resume.email}`} className="hover:text-accent">Email ↗</a>
            </li>
            <li>
              <a href="/resume.pdf" className="hover:text-accent">Résumé PDF ↗</a>
            </li>
            <li>
              <Link href="/showcase" className="hover:text-accent">인터랙티브 버전 →</Link>
            </li>
          </ul>
          <ThemeButton />
        </div>
      </aside>
    </>
  );
}
