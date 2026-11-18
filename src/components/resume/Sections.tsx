import Image from "next/image";
import type { ReactNode } from "react";
import { projects, resume, sections, type Project } from "@/lib/content";
import { RaceSim } from "@/components/fx/RaceSim";
import { GuardMachine } from "@/components/fx/GuardMachine";
import { CopyEmail } from "./CopyEmail";

function Section({ id, children }: { id: (typeof sections)[number]["id"]; children: ReactNode }) {
  const i = sections.findIndex((s) => s.id === id);
  return (
    <section id={id} className="scroll-mt-28 border-t border-line py-16 lg:scroll-mt-0 lg:py-20">
      <h2 className="font-mono mb-10 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest">
        <span className="text-accent">{String(i + 1).padStart(2, "0")}.</span>
        {sections[i].label}
      </h2>
      {children}
    </section>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return <li className="font-mono rounded border border-line px-2 py-0.5 text-xs text-muted">{children}</li>;
}

export function Hero() {
  return (
    <section id="top" className="pb-16 pt-12 lg:pb-20 lg:pt-28">
      <p className="font-mono text-sm text-accent">Hi, I&apos;m</p>
      <h1 className="mt-3 text-[clamp(2.6rem,7vw,4.2rem)] font-bold leading-none tracking-tight">{resume.name}</h1>
      <p className="font-mono mt-4 text-lg text-muted">{resume.title}</p>
      <p className="mt-8 max-w-[40ch] text-lg leading-relaxed md:text-xl">{resume.tagline}</p>
      <div className="mt-10 flex flex-wrap gap-3 text-sm font-semibold">
        <a href="#projects" className="rounded bg-accent px-5 py-2.5 text-bg hover:opacity-90">
          프로젝트 보기
        </a>
        <a href="/resume.pdf" className="rounded border border-line px-5 py-2.5 hover:border-fg">
          이력서 PDF
        </a>
        <a href={resume.github} target="_blank" rel="noreferrer" className="rounded border border-line px-5 py-2.5 hover:border-fg">
          GitHub
        </a>
      </div>
    </section>
  );
}

export function About() {
  return (
    <Section id="about">
      <div className="space-y-5 text-[1.05rem] leading-relaxed">
        {resume.about.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </Section>
  );
}

export function Skills() {
  return (
    <Section id="skills">
      <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-[9rem_1fr]">
        {resume.skills.map((g) => (
          <div key={g.group} className="contents">
            <dt className="font-mono pt-0.5 text-sm text-muted">{g.group}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <li key={s} className="rounded bg-card px-2.5 py-1 text-sm">
                    {s}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const sim = p.slug === "omfres" ? <RaceSim className="max-w-[520px]" /> : p.slug === "boardingpass" ? <GuardMachine /> : null;
  return (
    <article id={p.slug} className="scroll-mt-28 lg:scroll-mt-8">
      <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
        {p.preview ? (
          <figure className="mx-auto w-[58%] max-w-[220px] sm:w-full">
            <div className="relative aspect-[390/844] overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
              {/* 애니메이션 WebP는 next/image 최적화를 거치면 정지 화면이 되므로 img를 직접 쓴다.
                  모션 줄이기 설정이면 정지 프레임을 보여 준다. */}
              <picture>
                <source media="(prefers-reduced-motion: reduce)" srcSet={p.preview.poster} />
                <img
                  src={p.preview.src}
                  alt={`${p.title} 동작 화면 녹화`}
                  width={390}
                  height={844}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </picture>
            </div>
            {p.preview.note && <figcaption className="font-mono mt-2 text-center text-[11px] leading-snug text-muted">{p.preview.note}</figcaption>}
          </figure>
        ) : (
        <div className="relative aspect-[16/10] overflow-hidden rounded border border-line bg-card">
          {p.thumb ? (
            <Image src={p.thumb} alt={`${p.title} 화면`} fill sizes="(min-width: 640px) 180px, 100vw" className="object-cover object-top" />
          ) : (
            <div className="font-mono flex h-full items-center justify-center p-3 text-center text-xs" style={{ color: p.accent }}>
              {p.kind}
            </div>
          )}
        </div>
        )}

        <div>
          <p className="font-mono text-xs text-muted">{p.period}</p>
          <h3 className="mt-1 text-xl font-bold">
            {p.demo ? (
              <a href={p.demo} target="_blank" rel="noreferrer" className="hover:text-accent">
                {p.title} <span className="text-sm text-muted">↗</span>
              </a>
            ) : (
              p.title
            )}
          </h3>
          <p className="mt-1 text-sm text-muted">{p.role.ko}</p>
          <p className="mt-3 leading-relaxed">{p.summary.ko}</p>

          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {p.stats.map((s) => (
              <li key={s.value} className="text-sm">
                <span className="font-mono font-semibold text-accent">{s.value}</span>{" "}
                <span className="text-muted">{s.label.ko}</span>
              </li>
            ))}
          </ul>

          <ul className="mt-4 flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </ul>

          <details className="group mt-5 rounded border border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-2.5 text-sm font-semibold">
              문제와 해결 과정
              <span className="font-mono text-muted transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <div className="space-y-6 border-t border-line px-4 py-5 text-sm leading-relaxed">
              <ol className="space-y-6">
                {p.cases.map((c, i) => (
                  <li key={c.title}>
                    <h4 className="font-semibold">
                      <span className="font-mono mr-2 text-accent">{String(i + 1).padStart(2, "0")}</span>
                      {c.title}
                    </h4>
                    <dl className="mt-2 space-y-1.5 border-l border-line pl-4">
                      {(
                        [
                          ["문제", c.problem],
                          ["해결", c.solution],
                          ["결과", c.result],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k} className="grid grid-cols-[2.5rem_1fr] gap-2">
                          <dt className="font-mono text-xs leading-6 text-muted">{k}</dt>
                          <dd>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ol>
              {sim && (
                <div>
                  <p className="font-mono mb-3 text-xs text-muted">직접 눌러 볼 수 있는 재현</p>
                  {sim}
                </div>
              )}
            </div>
          </details>

          <div className="font-mono mt-4 flex gap-5 text-sm">
            {p.demo && (
              <a href={p.demo} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Live ↗
              </a>
            )}
            {p.repo && (
              <a href={p.repo} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Code ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  return (
    <Section id="projects">
      <div className="space-y-14">
        {projects.map((p) => (
          <ProjectCard key={p.slug} p={p} />
        ))}
      </div>
    </Section>
  );
}

function Entry({ period, title, sub, items }: { period: string; title: string; sub: string; items: string[] }) {
  return (
    <li className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:gap-8">
      <p className="font-mono pt-1 text-sm text-muted">{period}</p>
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-0.5 text-sm text-accent">{sub}</p>
        <ul className="mt-3 space-y-1.5 text-[0.95rem] leading-relaxed">
          {items.map((b) => (
            <li key={b} className="relative pl-4 before:absolute before:left-0 before:top-[0.7em] before:h-1 before:w-1 before:rounded-full before:bg-muted">
              {b}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export function Experience() {
  return (
    <Section id="experience">
      <ol className="space-y-10">
        {resume.experience.map((e) => (
          <Entry key={e.org} period={e.period} title={e.org} sub={e.title} items={e.bullets} />
        ))}
      </ol>
    </Section>
  );
}

export function Education() {
  return (
    <Section id="education">
      <ol className="space-y-10">
        {resume.education.map((e) => (
          <Entry key={e.school} period={e.period} title={e.school} sub={e.degree} items={e.achievements} />
        ))}
      </ol>
      <h3 className="font-mono mb-4 mt-12 text-sm text-muted">자격 · 수상</h3>
      <ul className="space-y-2">
        {resume.certificates.map((c) => (
          <li key={c.name} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-8">
            <span className="font-mono text-sm text-muted">{c.when}</span>
            <span>{c.name}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Contact() {
  return (
    <Section id="contact">
      <p className="text-muted">같이 만들 것이 있다면 편하게 연락 주세요.</p>
      <a href={`mailto:${resume.email}`} className="mt-3 block break-all text-[clamp(1.4rem,4vw,2.2rem)] font-bold hover:text-accent">
        {resume.email}
      </a>
      <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
        <CopyEmail email={resume.email} />
        <a href={resume.github} target="_blank" rel="noreferrer" className="rounded border border-line px-5 py-2.5 hover:border-fg">
          GitHub
        </a>
        <a href="/resume.pdf" className="rounded border border-line px-5 py-2.5 hover:border-fg">
          이력서 PDF
        </a>
      </div>
      <p className="font-mono mt-16 text-xs text-muted">Built with Next.js · Tailwind CSS</p>
    </Section>
  );
}
