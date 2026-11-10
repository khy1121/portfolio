"use client";

import Image from "next/image";
import { useSite } from "./Providers";
import { copy, projects } from "@/lib/content";

/* 프로젝트 미리보기 갤러리: 화면 캡처를 한 줄에 모아 보여 주고, 누르면 카드로 이동한다. */
export function ShotGrid({ className = "" }: { className?: string }) {
  const { lang } = useSite();
  const t = copy[lang].work;
  return (
    <div className={className}>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {projects.map((p) => (
          <li key={p.slug}>
            <a
              href={`#${p.slug}`}
              className="group block overflow-hidden rounded-2xl border border-line bg-card transition-colors hover:border-fg"
            >
              <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: `${p.accent}1a` }}>
                {p.thumb ? (
                  <Image
                    src={p.thumb}
                    alt={`${p.title} 화면`}
                    fill
                    sizes="(max-width: 768px) 50vw, 220px"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="font-display text-3xl font-bold" style={{ color: p.accent }}>
                      {p.stats[0].value}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate text-sm font-semibold">{p.title}</span>
                <span className="shrink-0 text-xs text-muted">{p.period}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">{t.gallery}</p>
    </div>
  );
}
