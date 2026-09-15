"use client";

import { useSite } from "./Providers";
import { copy, stack } from "@/lib/content";
import { Scramble, ScrambleOnHover } from "@/components/fx/Scramble";

export function About() {
  const { lang } = useSite();
  const t = copy[lang].about;
  return (
    <section id="about" className="rule mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-40">
      <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20">
        <Scramble as="h2" text={t.title} className="display whitespace-nowrap text-[clamp(2.6rem,6.5vw,5.5rem)]" />
        <div className="space-y-6 text-lg leading-relaxed md:text-xl">
          <p>{t.p1}</p>
          <p>{t.p2}</p>
          <p>{t.p3}</p>
          <p className="pt-4 text-base text-muted">{t.edu}</p>
        </div>
      </div>
      <div className="mt-20 grid gap-6 md:grid-cols-[1fr_1.4fr] md:gap-20">
        <h3 className="text-sm text-muted">{t.stackTitle}</h3>
        <ul className="flex flex-wrap gap-x-6 gap-y-3 font-display text-xl font-semibold md:text-2xl">
          {stack.map((s) => (
            <li key={s} className="transition-colors hover:text-accent" data-scramble-trigger>
              <ScrambleOnHover text={s} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
