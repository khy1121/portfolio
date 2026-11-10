"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useSite } from "./Providers";
import { copy, projects } from "@/lib/content";
import { useInView, usePrefersReducedMotion } from "@/lib/useEnv";

const TerrainField = dynamic(() => import("./TerrainField"), { ssr: false });

/* 첫 화면: 이름·직무·한 줄 소개와 프로젝트 바로가기. 배경의 등고선만 유일한 연출로 남긴다. */
export function Hero() {
  const { lang } = useSite();
  const t = copy[lang].hero;
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef(0);
  const introRef = useRef(1);
  const reduced = usePrefersReducedMotion();
  const visible = useInView(ref, "0px", true);

  return (
    <section ref={ref} id="top" className="relative overflow-hidden">
      {!reduced && (
        <div className="absolute inset-0 opacity-50" aria-hidden>
          <TerrainField scrollRef={scrollRef} introRef={introRef} active={visible} />
        </div>
      )}

      <div className="relative mx-auto max-w-[1100px] px-5 pb-16 pt-32 md:px-8 md:pb-24 md:pt-44">
        <p className="font-display text-sm font-semibold tracking-wide text-accent">{t.role}</p>
        <h1 className="display mt-4 text-[clamp(2.8rem,8vw,6rem)]">김헌영</h1>
        <p className="mt-6 max-w-[38ch] text-lg leading-relaxed text-muted md:text-xl">
          {t.line1}
          <br />
          {t.line2}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#work" className="rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent">
            {t.cta1}
          </a>
          <a href="/resume.pdf" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-fg">
            {t.cta2}
          </a>
        </div>

        {/* 프로젝트 바로가기: 이름과 숫자 하나 */}
        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {projects.map((p) => (
            <li key={p.slug} className="bg-bg">
              <a href={`#${p.slug}`} className="flex h-full flex-col gap-1 p-4 transition-colors hover:bg-card">
                <span className="font-display text-2xl font-bold tabular-nums" style={{ color: p.accent }}>
                  {p.stats[0].value}
                </span>
                <span className="text-xs text-muted">{p.stats[0].label[lang]}</span>
                <span className="mt-2 text-sm font-semibold">{p.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
