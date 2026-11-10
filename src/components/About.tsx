"use client";

import { useSite } from "./Providers";
import { copy, stack } from "@/lib/content";

export function About() {
  const { lang } = useSite();
  const t = copy[lang].about;
  return (
    <section id="about" className="rule mx-auto max-w-[1100px] scroll-mt-16 px-5 py-20 md:px-8 md:py-28">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)]">{t.title}</h2>
        <div className="space-y-5 text-lg leading-relaxed">
          <p>{t.p1}</p>
          <p>{t.p2}</p>
          <p>{t.p3}</p>
          <p className="pt-2 text-base text-muted">{t.edu}</p>
        </div>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-[1fr_2fr] md:gap-16">
        <h3 className="text-sm text-muted">{t.stackTitle}</h3>
        <ul className="flex flex-wrap gap-2">
          {stack.map((s) => (
            <li key={s} className="rounded-full border border-line px-3 py-1 text-sm">
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
