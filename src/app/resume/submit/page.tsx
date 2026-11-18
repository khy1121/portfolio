import type { Metadata } from "next";
import type { ReactNode } from "react";
import { projects, resume, type Project } from "@/lib/content";
import { PrintButton } from "../PrintButton";

/* 제출용 2쪽 이력서. 구성은 About Me → Tool & Skill → Project → Experience 순서이고,
   프로젝트마다 한 줄 소개 → 주요 경험 → 문제 상황 및 해결 과정 1가지 → 사용 기술을 적는다.
   전화번호는 공개 사이트에 올리지 않는다. PDF를 만들 때만 #phone 자리에 채워 넣는다. */

export const metadata: Metadata = {
  title: "김헌영 이력서 (제출용)",
  robots: { index: false, follow: false },
};

const SITE = "https://portfoliokhy.vercel.app";
const C = { ink: "#1f2328", sub: "#636c76", line: "#e5e7ea", soft: "#f6f7f8", accent: "#c26a12", tint: "#fbf3e6" };

const SKILLS: { group: string; items: string[] }[] = [
  { group: "Frontend", items: ["TypeScript", "JavaScript", "React", "Next.js (App Router)", "React Router", "Tailwind CSS", "Vitest · Testing Library", "Storybook · Chromatic"] },
  { group: "Data · Offline", items: ["Supabase (Auth·Postgres·RLS·Realtime)", "Upstash Redis", "REST API · Route Handlers", "PWA · Service Worker", "IndexedDB · ONNX Runtime Web"] },
  { group: "Tools", items: ["Git / GitHub", "GitHub Actions", "Vercel", "Docker", "Figma", "Claude Code"] },
];

function H2({ children }: { children: ReactNode }) {
  return <h2 className="mb-2.5 mt-5 text-[18px] font-bold italic tracking-tight first:mt-0">{children}</h2>;
}

function Dots({ items, className = "" }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={`list-disc space-y-[3px] pl-4 marker:text-[#9aa1a9] ${className}`}>
      {items.map((it, i) => (
        <li key={i} className="pl-0.5 leading-[1.6]">
          {it}
        </li>
      ))}
    </ul>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mt-2.5 text-[11.5px] font-bold">{children}</p>;
}

function ProjectBlock({ p }: { p: Project }) {
  const c = p.cases[0];
  return (
    <article className="grid grid-cols-[9.5rem_1fr] gap-5 border-t py-3 first:border-t-0 first:pt-0" style={{ borderColor: C.line }}>
      <div className="text-[11px]">
        <p className="text-[14px] font-bold">{p.title}</p>
        <p className="mt-1 leading-[1.5]" style={{ color: C.sub }}>
          {p.team}
        </p>
        <p className="font-mono mt-1 text-[10.5px]" style={{ color: C.sub }}>
          {p.period}
        </p>
        <p className="mt-2 space-x-2 text-[10.5px]">
          {p.demo && (
            <a href={p.demo} style={{ color: C.accent }}>
              서비스
            </a>
          )}
          {p.repo && (
            <a href={p.repo} style={{ color: C.accent }}>
              GitHub
            </a>
          )}
          <a href={`${SITE}/projects/${p.slug}`} style={{ color: C.accent }}>
            상세
          </a>
        </p>
      </div>
      <div className="min-w-0 text-[11px]">
        <p className="border-l-[3px] pl-2.5 text-[12px] font-semibold leading-[1.5]" style={{ borderColor: C.ink }}>
          {p.summary.ko}
        </p>
        <Label>주요 경험</Label>
        <Dots
          className="mt-1"
          items={[
            ...p.resumeLines,
            <b key="s">{p.stats.map((s) => `${s.label.ko.split(" · ")[0]} ${s.value}`).join(" · ")}</b>,
          ]}
        />
        <Label>문제 상황 및 해결 과정 — {c.title}</Label>
        <div className="mt-1 space-y-1 rounded-md px-3 py-2" style={{ background: C.soft }}>
          {(
            [
              ["문제 상황", c.problem],
              ["해결 과정", c.solution],
              ["결과", c.result],
            ] as const
          ).map(([k, v]) => (
            <p key={k} className="leading-[1.6]">
              <b className="mr-1.5" style={{ color: k === "결과" ? C.accent : C.ink }}>
                [{k}]
              </b>
              {v}
            </p>
          ))}
        </div>
        <p className="mt-2 text-[10.5px]" style={{ color: C.sub }}>
          <b style={{ color: C.ink }}>사용 기술</b> &nbsp;{p.stack.join(", ")}
        </p>
      </div>
    </article>
  );
}

export default function SubmitResumePage() {
  const featured = projects.filter((p) => p.featured);
  const others = projects.filter((p) => !p.featured);
  const exp = resume.experience.filter((e) => !e.org.startsWith("Cropy"));

  return (
    <div className="resume-root min-h-screen w-full bg-[#e9ecee] py-10 print:bg-white print:py-0" style={{ color: C.ink }}>
      <div className="mx-auto mb-4 flex max-w-[210mm] justify-end px-4 print:hidden">
        <PrintButton />
      </div>
      <main
        className="mx-auto max-w-[210mm] bg-white px-[15mm] py-[14mm] text-[11.5px] shadow-[0_8px_30px_rgba(0,0,0,0.08)] print:max-w-none print:px-0 print:py-0 print:shadow-none"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <header className="border-b pb-4" style={{ borderColor: C.line }}>
          <h1 className="text-[28px] font-extrabold tracking-tight">{resume.name} 이력서</h1>
          <p className="mt-1.5 text-[15px] font-semibold">Frontend Developer</p>
          <ul className="mt-2.5 grid grid-cols-2 gap-x-6 gap-y-0.5 text-[11px]">
            <li>
              <b>[ Email ]</b> {resume.email}
            </li>
            <li>
              <b>[ Phone ]</b> <span id="phone">요청 시 제공</span>
            </li>
            <li>
              <b>[ Github ]</b>{" "}
              <a href={resume.github} style={{ color: C.accent }}>
                github.com/khy1121
              </a>
            </li>
            <li>
              <b>[ Portfolio ]</b>{" "}
              <a href={SITE} style={{ color: C.accent }}>
                portfoliokhy.vercel.app
              </a>
            </li>
          </ul>
        </header>

        <div className="mt-6">
          <H2>About Me.</H2>
          {/* 증명사진은 공개 페이지에 두지 않는다. 제출용 PDF를 만들 때만 이 자리에 넣고 hidden을 푼다 */}
          <div className="flex items-start gap-4">
            <div id="photo-slot" className="hidden h-[31mm] w-[24mm] shrink-0 overflow-hidden rounded-[3px] border" style={{ borderColor: C.line }} />
            <div className="min-w-0 flex-1 space-y-1.5 text-[11.5px] leading-[1.65]">
            <p>
              <b>실제로 쓰이는 서비스를 끝까지 운영하는 프론트엔드 개발자</b> 김헌영입니다. 직접 만든 일정 조율 웹앱 Overlap은 출시 2주 만에 17명이 가입해 회의 6건을 확정했고,
              운영하며 들어온 의견은 바로 기능으로 반영합니다.
            </p>
            <p>기능을 만들 때 &ldquo;이게 실패하면 사용자는 다음에 무엇을 할 수 있나&rdquo;를 먼저 정하고, 사용자가 막히는 지점마다 복구 경로를 설계해 왔습니다.</p>
            <p>PR마다 변경 범위와 테스트·빌드 결과, 검증하지 못한 항목을 남기며 팀과 같은 방식으로 일하는 것을 중요하게 생각합니다.</p>
          </div>
          </div>

          <H2>Tool &amp; Skill.</H2>
          <div className="grid grid-cols-3 gap-4 text-[11px]">
            {SKILLS.map((g, i) => (
              <div key={g.group}>
                <p className="mb-1.5 rounded px-2 py-1 font-bold" style={{ background: i === 0 ? C.tint : C.soft }}>
                  {g.group}
                </p>
                <p className="px-1 leading-[1.7]">{g.items.join(" · ")}</p>
              </div>
            ))}
          </div>

          <H2>Project.</H2>
          {featured.map((p) => (
            <ProjectBlock key={p.slug} p={p} />
          ))}
          <div className="mt-1 border-t pt-3 text-[11px]" style={{ borderColor: C.line }}>
            <p className="mb-1.5 font-bold">그 밖의 프로젝트</p>
            <ul className="space-y-1">
              {others.map((p) => (
                <li key={p.slug} className="grid grid-cols-[9.5rem_1fr] gap-5">
                  <span>
                    <b>{p.title}</b>{" "}
                    <span className="font-mono text-[10px]" style={{ color: C.sub }}>
                      {p.period}
                    </span>
                  </span>
                  <span className="leading-[1.6]">
                    {p.resumeLines[0]}{" "}
                    <a href={`${SITE}/projects/${p.slug}`} style={{ color: C.accent }}>
                      상세
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <H2>Experience.</H2>
          <div className="space-y-3 text-[11px]">
            {exp.map((e) => (
              <div key={e.org} className="grid grid-cols-[9.5rem_1fr] gap-5">
                <div>
                  <p className="text-[12.5px] font-bold">{e.org}</p>
                  <p className="font-mono mt-0.5 text-[10.5px]" style={{ color: C.sub }}>
                    {e.period}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">{e.title}</p>
                  <Dots className="mt-1" items={e.bullets.slice(0, 2)} />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-[9.5rem_1fr] gap-5">
              <div>
                <p className="text-[12.5px] font-bold">한성대학교</p>
                <p className="font-mono mt-0.5 text-[10.5px]" style={{ color: C.sub }}>
                  2021.03 – 2027.02
                </p>
              </div>
              <div>
                <p className="font-semibold">컴퓨터공학부 웹공학트랙 · 졸업예정</p>
                <Dots className="mt-1" items={["전공 평점 3.94 / 4.5 · 단과대 최우수 장학금", resume.certificates.map((c) => `${c.name} (${c.when})`).join(" · ")]} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
