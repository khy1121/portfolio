"use client";

import { useSite } from "./Providers";
import { copy, projects, type Project } from "@/lib/content";
import { ProjectStage } from "./ProjectStage";
import { ShotGrid } from "./ShotGrid";
import { RaceSim } from "@/components/fx/RaceSim";
import { GuardMachine } from "@/components/fx/GuardMachine";

function Card({ p }: { p: Project }) {
  const { lang } = useSite();
  const t = copy[lang].work;
  const hasDemoWidget = p.slug === "omfres" || p.slug === "boardingpass";

  return (
    <article id={p.slug} className="scroll-mt-24 overflow-hidden rounded-3xl border border-line bg-card">
      <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_0.8fr] md:gap-10 md:p-8">
        <div className="flex flex-col gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="rounded-full px-3 py-1 font-semibold" style={{ backgroundColor: `${p.accent}22`, color: p.accent }}>
                {p.kind}
              </span>
              <span>{p.period}</span>
            </div>
            <h3 className="display mt-4 text-[clamp(1.9rem,4vw,3rem)]">{p.title}</h3>
            <p className="mt-3 max-w-[46ch] leading-relaxed md:text-lg">{p.summary[lang]}</p>
            <p className="mt-2 text-sm text-muted">{p.role[lang]}</p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {p.stats.map((s) => (
              <div key={s.value}>
                <div className="font-display text-3xl font-bold tabular-nums md:text-4xl" style={{ color: p.accent }}>
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-muted">{s.label[lang]}</div>
              </div>
            ))}
          </div>

          <details className="group rounded-2xl border border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
              {t.more}
              <span className="text-muted transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <div className="space-y-5 border-t border-line px-4 py-4">
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted">{t.problem}</dt>
                  <dd className="mt-1 leading-relaxed">{p.problem[lang]}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted">{t.result}</dt>
                  <dd className="mt-1 leading-relaxed">{p.result[lang]}</dd>
                </div>
              </dl>
              {hasDemoWidget && (
                <div>
                  <p className="mb-3 text-sm text-muted">{t.tryIt}</p>
                  {p.slug === "omfres" && <RaceSim className="max-w-[520px]" />}
                  {p.slug === "boardingpass" && <GuardMachine />}
                </div>
              )}
            </div>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <ul className="flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <li key={s} className="rounded-full border border-line px-3 py-1 text-xs">
                  {s}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 text-sm font-semibold">
              {p.repo && (
                <a href={p.repo} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {t.repo}
                </a>
              )}
              {p.demo && (
                <a href={p.demo} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {t.demo}
                </a>
              )}
            </div>
          </div>
        </div>

        <ProjectStage p={p} />
      </div>
    </article>
  );
}

export function Projects() {
  const { lang } = useSite();
  const t = copy[lang].work;
  return (
    <section id="work" className="rule mx-auto max-w-[1100px] scroll-mt-16 px-5 py-20 md:px-8 md:py-28">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)]">{t.title}</h2>
        <p className="max-w-[40ch] text-muted">{t.lead}</p>
      </div>
      <ShotGrid className="mb-12" />
      <div className="space-y-8">
        {projects.map((p) => (
          <Card key={p.slug} p={p} />
        ))}
      </div>
    </section>
  );
}
