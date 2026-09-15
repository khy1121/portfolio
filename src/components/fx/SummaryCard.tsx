"use client";

import { profile, projects } from "@/lib/content";

/* ⌘K 팔레트의 "한 장 요약" 탭.
   급한 채용 담당자가 두 번의 키 입력으로 학력·프로젝트·숫자·링크를 한 화면에서 보게 한다.
   애니메이션 없음. 여기서는 읽히는 것이 전부다. */
export function SummaryCard({ onNavigate }: { onNavigate?: (href: string) => void }) {
  const go = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#") || !onNavigate) return;
    e.preventDefault();
    onNavigate(href);
  };

  return (
    <div className="max-h-[60vh] overflow-y-auto px-4 pb-4 text-fg">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-2xl font-bold">{profile.name}</span>
        <span className="text-sm text-muted">{profile.role}</span>
        <span className="ml-auto rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
          {profile.looking}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted">
        {profile.school} · {profile.graduation}
        <br />
        {profile.gpa} · {profile.honor} · {profile.certs.join(" · ")}
      </p>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {profile.highlights.map((h) => (
          <li key={h.k}>
            <div className="font-display text-base font-bold tabular-nums text-accent">{h.v}</div>
            <div className="text-[11px] text-muted">{h.k}</div>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-xs text-muted">프로젝트</h3>
      <ul className="mt-2 space-y-2">
        {projects.map((p) => (
          <li key={p.slug} className="flex flex-wrap items-baseline gap-x-2 border-b border-line pb-2 last:border-0">
            <span className="font-semibold">{p.title}</span>
            <span className="text-xs text-muted">{p.kind}</span>
            <span className="text-xs text-muted">· {p.period}</span>
            <span className="ml-auto flex gap-2 text-xs font-semibold">
              <a href={p.repo} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-accent hover:underline">
                코드
              </a>
              {p.demo && (
                <a href={p.demo} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-accent hover:underline">
                  배포
                </a>
              )}
            </span>
            <p className="w-full text-xs leading-relaxed text-muted">{p.result.ko}</p>
          </li>
        ))}
      </ul>

      <h3 className="mt-5 text-xs text-muted">일하는 원칙</h3>
      <ul className="mt-1 space-y-0.5 text-sm">
        {profile.principles.map((s) => (
          <li key={s}>· {s}</li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
        <a href={`mailto:${profile.email}`} className="rounded-full bg-fg px-4 py-2 text-bg transition-colors hover:bg-accent">
          {profile.email}
        </a>
        <a href={profile.resume} className="rounded-full border border-line px-4 py-2 transition-colors hover:border-fg">
          이력서 PDF
        </a>
        <a href={profile.github} target="_blank" rel="noreferrer" className="rounded-full border border-line px-4 py-2 transition-colors hover:border-fg">
          GitHub
        </a>
        <a href="#work" onClick={go("#work")} className="rounded-full border border-line px-4 py-2 transition-colors hover:border-fg">
          프로젝트로 이동
        </a>
      </div>
    </div>
  );
}
