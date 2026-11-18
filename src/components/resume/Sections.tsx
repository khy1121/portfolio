import Link from "next/link";
import type { ReactNode } from "react";
import { projects, resume, sections, type Project } from "@/lib/content";
import { skillGroups, type Skill } from "@/lib/skills";
import { CopyEmail } from "./CopyEmail";
import { ExternalLinks, PhonePreview, StatusBadge, Stats, Tag } from "./ProjectParts";

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

/* 배경색 밝기에 따라 글자·로고를 흰색/검정으로 고른다 */
function onColor(hex: string) {
  const n = parseInt(hex, 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#111" : "#fff";
}

function SkillBadge({ s }: { s: Skill }) {
  const hex = s.color ?? s.icon?.hex ?? "4A4F55";
  const fg = onColor(hex);
  return (
    <li
      className="font-mono inline-flex items-center gap-1.5 rounded-[4px] px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ring-white/10"
      style={{ backgroundColor: `#${hex}`, color: fg }}
    >
      {s.icon && (
        <svg role="img" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill={fg} aria-hidden>
          <path d={s.icon.path} />
        </svg>
      )}
      {s.name}
    </li>
  );
}

export function Skills() {
  return (
    <Section id="skills">
      <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-[9rem_1fr]">
        {skillGroups.map((g) => (
          <div key={g.group} className="contents">
            <dt className="font-mono pt-1.5 text-sm text-muted">{g.group}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {g.items.map((s) => (
                  <SkillBadge key={s.name} s={s} />
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function FeaturedCard({ p }: { p: Project }) {
  return (
    <article id={p.slug} className="scroll-mt-28 lg:scroll-mt-8">
      <div className="grid gap-6 sm:grid-cols-[200px_1fr] sm:gap-8">
        <Link href={`/projects/${p.slug}`} className="mx-auto block w-[58%] max-w-[220px] sm:w-full" aria-label={`${p.title} 자세히 보기`}>
          <PhonePreview p={p} className="transition-transform duration-300 hover:-translate-y-1" />
        </Link>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <StatusBadge status={p.status} />
            <span className="font-mono">{p.period}</span>
            <span aria-hidden>·</span>
            <span>{p.team}</span>
          </div>
          <h3 className="mt-3 text-2xl font-bold">
            <Link href={`/projects/${p.slug}`} className="hover:text-accent">
              {p.title}
            </Link>
          </h3>
          <p className="font-mono mt-1 text-xs" style={{ color: p.accent }}>
            {p.kind}
          </p>
          <p className="mt-4 leading-relaxed">{p.summary.ko}</p>
          <div className="mt-5">
            <Stats p={p} large />
          </div>
          <ul className="mt-5 flex flex-wrap gap-2">
            {p.stack.map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link href={`/projects/${p.slug}`} className="rounded bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-90">
              문제와 해결 과정 보기 →
            </Link>
            <ExternalLinks p={p} />
          </div>
        </div>
      </div>
    </article>
  );
}

function OtherRow({ p, n }: { p: Project; n: number }) {
  return (
    <li>
      <Link
        href={`/projects/${p.slug}`}
        className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-t border-line py-5 transition-colors hover:bg-card/50 sm:px-2"
      >
        <span className="font-mono text-xs text-muted">{String(n).padStart(2, "0")}</span>
        <span>
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold group-hover:text-accent">{p.title}</span>
            <StatusBadge status={p.status} />
          </span>
          <span className="mt-1 block text-sm text-muted">
            {p.kind} · <span className="font-mono">{p.period}</span> · {p.team}
          </span>
        </span>
        <span className="font-mono text-sm text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" aria-hidden>
          →
        </span>
      </Link>
    </li>
  );
}

export function Projects() {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  return (
    <Section id="projects">
      <p className="mb-10 text-muted">대표 프로젝트 {featured.length}개입니다. 프로젝트를 누르면 문제와 해결 과정을 한 페이지에서 볼 수 있어요.</p>
      <div className="space-y-16">
        {featured.map((p) => (
          <FeaturedCard key={p.slug} p={p} />
        ))}
      </div>
      <h3 className="font-mono mb-2 mt-20 text-sm text-muted">다른 프로젝트</h3>
      <ol className="border-b border-line">
        {others.map((p, i) => (
          <OtherRow key={p.slug} p={p} n={featured.length + i + 1} />
        ))}
      </ol>
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
