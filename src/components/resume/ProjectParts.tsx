import Image from "next/image";
import type { ReactNode } from "react";
import type { Project } from "@/lib/content";
import { RaceSim } from "@/components/fx/RaceSim";
import { GuardMachine } from "@/components/fx/GuardMachine";

/* 홈 카드와 프로젝트 상세 페이지가 함께 쓰는 조각들 */

export function Tag({ children }: { children: ReactNode }) {
  return <li className="font-mono rounded border border-line px-2 py-0.5 text-xs text-muted">{children}</li>;
}

const statusStyle: Record<Project["status"], string> = {
  "운영 중": "border-emerald-500/40 text-emerald-500",
  "진행 중": "border-accent/50 text-accent",
  종료: "border-line text-muted",
};

export function StatusBadge({ status }: { status: Project["status"] }) {
  return (
    <span className={`font-mono inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${statusStyle[status]}`}>
      {status !== "종료" && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {status}
    </span>
  );
}

/* 휴대폰 비율 동작 미리보기. 애니메이션 WebP는 next/image 최적화를 거치면 정지 화면이 되므로 img를 직접 쓰고,
   모션 줄이기 설정이면 정지 프레임을 보여 준다. 미리보기가 없으면 썸네일이나 분류 문구로 대신한다. */
export function PhonePreview({ p, eager = false, className = "" }: { p: Project; eager?: boolean; className?: string }) {
  if (p.preview) {
    return (
      <figure className={className}>
        <div className="relative aspect-[390/844] overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
          <picture>
            <source media="(prefers-reduced-motion: reduce)" srcSet={p.preview.poster} />
            <img
              src={p.preview.src}
              alt={`${p.title} 동작 화면 녹화`}
              width={390}
              height={844}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          </picture>
        </div>
        {p.preview.note && <figcaption className="font-mono mt-2 text-center text-[11px] leading-snug text-muted">{p.preview.note}</figcaption>}
      </figure>
    );
  }
  return (
    <div className={`relative aspect-[16/10] overflow-hidden rounded border border-line bg-card ${className}`}>
      {p.thumb ? (
        <Image src={p.thumb} alt={`${p.title} 화면`} fill sizes="240px" className="object-cover object-top" />
      ) : (
        <div className="font-mono flex h-full items-center justify-center p-3 text-center text-xs" style={{ color: p.accent }}>
          {p.kind}
        </div>
      )}
    </div>
  );
}

export function Stats({ p, large = false }: { p: Project; large?: boolean }) {
  return (
    <ul className={`flex flex-wrap ${large ? "gap-x-10 gap-y-4" : "gap-x-6 gap-y-2"}`}>
      {p.stats.map((s) =>
        large ? (
          <li key={s.value}>
            <div className="font-mono text-3xl font-semibold tabular-nums" style={{ color: p.accent }}>
              {s.value}
            </div>
            <div className="mt-1 text-xs text-muted">{s.label.ko}</div>
          </li>
        ) : (
          <li key={s.value} className="text-sm">
            <span className="font-mono font-semibold text-accent">{s.value}</span> <span className="text-muted">{s.label.ko}</span>
          </li>
        ),
      )}
    </ul>
  );
}

export function ExternalLinks({ p }: { p: Project }) {
  return (
    <div className="font-mono flex gap-5 text-sm">
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
  );
}

/* 문제와 해결 과정 3가지를 펼친 상태로 보여 준다 */
export function CaseStudies({ p }: { p: Project }) {
  return (
    <ol className="space-y-6">
      {p.cases.map((c, i) => (
        <li key={c.title} className="rounded-xl border border-line bg-card/40 p-5 md:p-6">
          <h3 className="text-lg font-bold">
            <span className="font-mono mr-3 text-accent">{String(i + 1).padStart(2, "0")}</span>
            {c.title}
          </h3>
          <dl className="mt-4 space-y-3 leading-relaxed">
            {(
              [
                ["문제", c.problem],
                ["해결", c.solution],
                ["결과", c.result],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[3rem_1fr] sm:gap-3">
                <dt className="font-mono text-xs leading-7 text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ol>
  );
}

/* 직접 눌러 볼 수 있는 재현 위젯이 있는 프로젝트만 */
export function ProjectSim({ p }: { p: Project }) {
  if (p.slug === "omfres") return <RaceSim className="max-w-[520px]" />;
  if (p.slug === "boardingpass") return <GuardMachine />;
  return null;
}

export const hasSim = (p: Project) => p.slug === "omfres" || p.slug === "boardingpass";
