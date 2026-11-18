import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { projects, resume, type Project } from "@/lib/content";
import { skillGroups } from "@/lib/skills";
import { PrintButton } from "./PrintButton";

/* 이력서. 구성은 catsbi 이력서(소개 → 경력 → 기술 → 학력 → 주요 프로젝트 → 경력기술서)를 따르고,
   내용은 포트폴리오 사이트와 같은 데이터(content.ts)를 쓴다. A4로 인쇄해 /resume.pdf를 만든다.
   사이트 테마와 상관없이 항상 밝은 종이 색으로 그린다. */

export const metadata: Metadata = {
  title: "김헌영 이력서 — Frontend Developer",
  description: resume.tagline,
};

const SITE = "https://portfoliokhy.vercel.app";
const C = { ink: "#14181b", sub: "#5b6670", line: "#e3e6e8", soft: "#f5f6f7", accent: "#c26a12" };

const STATUS: Record<Project["status"], { bg: string; fg: string }> = {
  "운영 중": { bg: "#e3f6ee", fg: "#127a52" },
  "진행 중": { bg: "#fdf1e2", fg: "#a35a0c" },
  종료: { bg: "#eef0f2", fg: "#5b6670" },
};

function Status({ s }: { s: Project["status"] }) {
  return (
    <span className="inline-block rounded-full px-2 py-[1px] text-[10px] font-semibold" style={{ background: STATUS[s].bg, color: STATUS[s].fg }}>
      {s}
    </span>
  );
}

function Section({ no, title, children, breakBefore = false, keep = false }: { no: string; title: string; children: ReactNode; breakBefore?: boolean; keep?: boolean }) {
  return (
    <section className={`mt-10 first:mt-0 ${keep ? "break-inside-avoid" : ""}`} style={breakBefore ? { breakBefore: "page" } : undefined}>
      <h2 className="mb-4 flex items-baseline gap-2 border-b pb-2 text-[17px] font-bold" style={{ borderColor: C.ink }}>
        <span className="font-mono text-[12px]" style={{ color: C.accent }}>
          {no}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="relative pl-3.5 leading-[1.7]">
      <span className="absolute left-0 top-[0.72em] h-[5px] w-[5px] rounded-full" style={{ background: C.accent }} aria-hidden />
      {children}
    </li>
  );
}

const featured = projects.filter((p) => p.featured);
const others = projects.filter((p) => !p.featured);

function ProjectDetail({ p, full }: { p: Project; full: boolean }) {
  const cases = full ? p.cases : p.cases.slice(0, 1);
  return (
    <article className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1" style={{ breakAfter: "avoid" }}>
        <h3 className="text-[16px] font-bold">
          {p.title}
          <span className="ml-2 text-[12px] font-medium" style={{ color: C.sub }}>
            {p.kind}
          </span>
        </h3>
        <span className="font-mono text-[11px]" style={{ color: C.sub }}>
          {p.period}
        </span>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px]" style={{ color: C.sub }}>
        <Status s={p.status} />
        <span>{p.role.ko}</span>
      </p>
      <p className="font-mono mt-1 text-[10.5px]" style={{ color: C.sub }}>
        {p.stack.join(" · ")}
        {"  |  "}
        <a href={`${SITE}/projects/${p.slug}`} style={{ color: C.accent }}>
          상세 페이지
        </a>
        {p.demo && (
          <>
            {" · "}
            <a href={p.demo} style={{ color: C.accent }}>
              서비스
            </a>
          </>
        )}
        {p.repo && (
          <>
            {" · "}
            <a href={p.repo} style={{ color: C.accent }}>
              GitHub
            </a>
          </>
        )}
      </p>
      <p className="mt-3 text-[12.5px] leading-[1.7]">{p.summary.ko}</p>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11.5px]">
        {p.stats.map((s) => (
          <span key={s.value}>
            <b className="font-mono text-[13px]" style={{ color: C.accent }}>
              {s.value}
            </b>{" "}
            <span style={{ color: C.sub }}>{s.label.ko}</span>
          </span>
        ))}
      </div>
      <ol className="mt-3 space-y-2.5">
        {cases.map((c, i) => (
          <li key={c.title} className="break-inside-avoid rounded-lg p-3" style={{ background: C.soft }}>
            <p className="text-[12.5px] font-bold">
              <span className="font-mono mr-1.5" style={{ color: C.accent }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              {c.title}
            </p>
            <dl className="mt-1.5 space-y-1 text-[11.5px] leading-[1.65]">
              {(
                [
                  ["문제", c.problem],
                  ["해결", c.solution],
                  ["결과", c.result],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[2.4rem_1fr]">
                  <dt className="font-mono text-[10.5px] leading-[1.9]" style={{ color: k === "결과" ? C.accent : C.sub }}>
                    {k}
                  </dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </article>
  );
}

export default function ResumePage() {
  return (
    <div className="resume-root min-h-screen w-full bg-[#e9ecee] py-10 print:bg-white print:py-0" style={{ color: C.ink }}>
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <Link href="/" className="font-mono text-xs" style={{ color: C.sub }}>
          ← 포트폴리오로
        </Link>
        <PrintButton />
      </div>

      <main
        className="mx-auto max-w-[210mm] bg-white px-[16mm] py-[16mm] text-[13px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] print:max-w-none print:px-0 print:py-0 print:shadow-none"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {/* 머리말 */}
        <header className="grid gap-5 border-b-2 pb-6 sm:grid-cols-[1fr_auto] sm:items-end" style={{ borderColor: C.ink }}>
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold tracking-[0.2em]" style={{ color: C.accent }}>
              FRONTEND DEVELOPER
            </p>
            <h1 className="mt-1 text-[34px] font-extrabold leading-none tracking-tight">{resume.name}</h1>
            <p className="mt-3 text-[13.5px] font-medium leading-[1.6]">{resume.tagline}</p>
          </div>
          <ul className="font-mono space-y-1 whitespace-nowrap text-[10.5px] sm:text-right" style={{ color: C.sub }}>
            <li>
              <a href={`mailto:${resume.email}`}>{resume.email}</a>
            </li>
            <li>
              <a href={resume.github}>github.com/khy1121</a>
            </li>
            <li>
              <a href={SITE} style={{ color: C.accent }}>
                portfoliokhy.vercel.app
              </a>
            </li>
            <li>2027.02 졸업 예정 · 2026.12부터 근무 가능</li>
          </ul>
        </header>

        <div className="mt-8">
          <Section no="01" title="소개">
            <ul className="space-y-1.5 text-[12.5px]">
              {resume.about.map((t) => (
                <Bullet key={t}>{t}</Bullet>
              ))}
            </ul>
          </Section>

          <Section no="02" title="활동">
            <ol className="space-y-4">
              {resume.experience.map((e) => (
                <li key={e.org} className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                  <span className="font-mono pt-[2px] text-[11px]" style={{ color: C.sub }}>
                    {e.period}
                  </span>
                  <div>
                    <p className="text-[13.5px] font-bold">
                      {e.org}
                      <span className="ml-2 text-[11.5px] font-medium" style={{ color: C.accent }}>
                        {e.title}
                      </span>
                    </p>
                    <ul className="mt-1.5 space-y-1 text-[12px]">
                      {e.bullets.map((b) => (
                        <Bullet key={b}>{b}</Bullet>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </Section>

          <Section no="03" title="보유 기술" keep>
            <dl className="grid gap-x-4 gap-y-2.5 sm:grid-cols-[8.5rem_1fr]">
              {skillGroups.map((g) => (
                <div key={g.group} className="contents">
                  <dt className="font-mono pt-[3px] text-[11px]" style={{ color: C.sub }}>
                    {g.group}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {g.items.map((s) => {
                      const hex = s.color ?? s.icon?.hex ?? "4A4F55";
                      return (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 rounded-[4px] border px-2 py-[2px] text-[11px] font-medium"
                          style={{ borderColor: `#${hex}55`, background: `#${hex}12` }}
                        >
                          {s.icon && (
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill={`#${hex === "000000" || hex === "181717" || hex === "191919" ? "14181b" : hex}`} aria-hidden>
                              <path d={s.icon.path} />
                            </svg>
                          )}
                          {s.name}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section no="04" title="학력 및 자격" keep>
            <ul className="space-y-1.5 text-[12.5px]">
              {resume.education.map((e) => (
                <li key={e.school} className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                  <span className="font-mono pt-[2px] text-[11px]" style={{ color: C.sub }}>
                    {e.period}
                  </span>
                  <span>
                    <b>{e.school}</b> {e.degree} · {e.achievements.join(" · ")}
                  </span>
                </li>
              ))}
              {resume.certificates.map((c) => (
                <li key={c.name} className="grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
                  <span className="font-mono pt-[2px] text-[11px]" style={{ color: C.sub }}>
                    {c.when}
                  </span>
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section no="05" title="주요 프로젝트">
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="text-left" style={{ color: C.sub }}>
                  <th className="border-b py-1.5 pr-2 font-mono font-medium" style={{ borderColor: C.line }}>
                    기간
                  </th>
                  <th className="border-b py-1.5 pr-2 font-medium" style={{ borderColor: C.line }}>
                    프로젝트
                  </th>
                  <th className="border-b py-1.5 pr-2 font-medium" style={{ borderColor: C.line }}>
                    역할 · 팀
                  </th>
                  <th className="border-b py-1.5 font-medium" style={{ borderColor: C.line }}>
                    핵심 성과
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.slug} className="align-top">
                    <td className="font-mono whitespace-nowrap border-b py-2 pr-2 text-[10.5px]" style={{ borderColor: C.line, color: C.sub }}>
                      {p.period}
                    </td>
                    <td className="border-b py-2 pr-2" style={{ borderColor: C.line }}>
                      <b>{p.title}</b>
                      {p.featured && (
                        <span className="ml-1 text-[9px] font-bold" style={{ color: C.accent }}>
                          대표
                        </span>
                      )}
                      <div className="mt-0.5">
                        <Status s={p.status} />
                      </div>
                    </td>
                    <td className="border-b py-2 pr-2" style={{ borderColor: C.line }}>
                      {p.team}
                    </td>
                    <td className="border-b py-2" style={{ borderColor: C.line }}>
                      {p.stats.map((s) => `${s.value} ${s.label.ko}`).join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section no="06" title="프로젝트 기술서" breakBefore>
            <p className="mb-5 text-[11.5px]" style={{ color: C.sub }}>
              대표 프로젝트는 문제 해결 과정 3가지, 나머지는 대표 사례 1가지를 적었습니다. 모든 프로젝트의 동작 화면과 직접 눌러 보는 문제 재현은 포트폴리오 사이트의 상세 페이지에 있습니다.
            </p>
            {featured.map((p) => (
              <ProjectDetail key={p.slug} p={p} full />
            ))}
            <h3 className="mb-4 mt-2 border-t pt-4 font-mono text-[11px] font-semibold tracking-wider" style={{ borderColor: C.line, color: C.sub }}>
              다른 프로젝트
            </h3>
            {others.map((p) => (
              <ProjectDetail key={p.slug} p={p} full={false} />
            ))}
          </Section>
        </div>

        <footer className="font-mono mt-10 border-t pt-3 text-center text-[10px]" style={{ borderColor: C.line, color: C.sub }}>
          {resume.name} · {resume.email} · {SITE.replace("https://", "")}
        </footer>
      </main>
    </div>
  );
}
