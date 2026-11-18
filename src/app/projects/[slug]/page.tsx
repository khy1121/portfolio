import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects } from "@/lib/content";
import { ThemeButton } from "@/components/resume/Sidebar";
import { CaseStudies, ExternalLinks, PhonePreview, SimSection, StatusBadge, Stats, Tag, hasSim } from "@/components/resume/ProjectParts";

/* 프로젝트 상세(케이스 스터디). 홈에서는 요약만 보여 주고, 문제와 해결 과정은 여기서 한 프로젝트씩 읽는다 */

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return { title: `${p.title} — 김헌영`, description: p.summary.ko };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const i = projects.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const p = projects[i];
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];

  const meta: [string, ReactNode][] = [
    ["상태", <StatusBadge key="s" status={p.status} />],
    ["기간", <span key="p" className="font-mono">{p.period}</span>],
    ["팀", p.team],
    ["역할", p.role.ko],
  ];

  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 sm:px-8">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <Link href="/#projects" className="font-mono text-sm text-muted hover:text-fg">
          ← 김헌영 · 모든 프로젝트
        </Link>
        <ThemeButton />
      </header>

      <main>
        <section className="grid gap-10 py-12 md:grid-cols-[260px_1fr] md:gap-14 md:py-16">
          <PhonePreview p={p} eager className="mx-auto w-[62%] max-w-[260px] md:w-full" />
          <div>
            <p className="font-mono text-sm" style={{ color: p.accent }}>
              {p.kind}
            </p>
            <h1 className="mt-2 text-[clamp(2.2rem,6vw,3.4rem)] font-bold leading-tight tracking-tight">{p.title}</h1>
            <p className="mt-5 text-lg leading-relaxed">{p.summary.ko}</p>

            <dl className="mt-8 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[4rem_1fr]">
              {meta.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-mono text-muted">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              <dt className="font-mono text-muted">기술</dt>
              <dd>
                <ul className="flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </ul>
              </dd>
            </dl>

            <div className="mt-8 border-t border-line pt-6">
              <Stats p={p} large />
            </div>
            <div className="mt-8">
              <ExternalLinks p={p} />
            </div>
          </div>
        </section>

        <section className="border-t border-line py-12 md:py-16">
          <h2 className="font-mono mb-8 text-sm font-semibold uppercase tracking-widest">
            <span className="text-accent">01.</span> 문제와 해결 과정
          </h2>
          <CaseStudies p={p} />
        </section>

        {hasSim(p) && (
          <section className="border-t border-line py-12 md:py-16">
            <h2 className="font-mono mb-6 text-sm font-semibold uppercase tracking-widest">
              <span className="text-accent">02.</span> 직접 눌러 보기
            </h2>
            <SimSection p={p} />
          </section>
        )}

        <nav className="grid gap-4 border-t border-line py-10 sm:grid-cols-2" aria-label="다른 프로젝트">
          <Link href={`/projects/${prev.slug}`} className="group rounded-xl border border-line p-5 hover:border-fg">
            <span className="font-mono text-xs text-muted">← 이전 프로젝트</span>
            <span className="mt-1 block text-lg font-bold group-hover:text-accent">{prev.title}</span>
          </Link>
          <Link href={`/projects/${next.slug}`} className="group rounded-xl border border-line p-5 text-right hover:border-fg">
            <span className="font-mono text-xs text-muted">다음 프로젝트 →</span>
            <span className="mt-1 block text-lg font-bold group-hover:text-accent">{next.title}</span>
          </Link>
        </nav>
      </main>
    </div>
  );
}
