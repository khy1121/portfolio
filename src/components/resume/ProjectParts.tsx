import Image from "next/image";
import type { ReactNode } from "react";
import type { Project } from "@/lib/content";
import { RaceSim } from "@/components/fx/RaceSim";
import { GuardMachine } from "@/components/fx/GuardMachine";
import { OverlapSim } from "@/components/fx/OverlapSim";
import { BbungSim } from "@/components/fx/BbungSim";
import { NadokSim } from "@/components/fx/NadokSim";
import { CropySim } from "@/components/fx/CropySim";

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

/* 프로젝트마다 문제와 해결 과정 중 하나를 그대로 재현한 위젯과, 따라 누를 순서 */
const SIMS: Record<string, { caseNo: number; steps: string[]; node: () => ReactNode }> = {
  overlap: {
    caseNo: 1,
    steps: ["왼쪽 '나'의 칸을 눌러 칠해 보세요. 겹치는 시간이 바로 추천됩니다.", "「민지가 일정 바꾸기」를 누르면 추천도 즉시 따라 바뀝니다.", "「실시간 동기화 끄기」를 켜고 다시 바꿔 보세요. 옛 정보로 추천해 버립니다."],
    node: () => <OverlapSim />,
  },
  bbung: {
    caseNo: 1,
    steps: ["스위치가 켜진 상태(수정 전)에서 「앱 다시 열기」를 누르세요. 첫 요청 두 개가 401을 받습니다.", "스위치를 끄고(수정 후) 다시 실행하면 첫 요청부터 200입니다."],
    node: () => <BbungSim />,
  },
  nadok: {
    caseNo: 2,
    steps: ["「① 새 버전 배포」 → 「② 책 상세로 이동」 순서로 누르세요. 화면이 하얗게 깨집니다.", "스위치를 끄고(수정 후) 같은 순서로 누르면 한 번 새로고침해 새 버전으로 열립니다."],
    node: () => <NadokSim />,
  },
  cropy: {
    caseNo: 2,
    steps: ["「애매한 잎 사진」을 고르세요. 수정 전에는 틀린 병해로 단정합니다.", "스위치를 끄면(수정 후) 접전으로 판단해 추가 촬영을 요청하고, 두 사진을 합쳐 맞힙니다."],
    node: () => <CropySim />,
  },
  boardingpass: {
    caseNo: 1,
    steps: ["오른쪽 위 「가드 없이」를 켜세요.", "「카카오 로그인」 → 「온보딩 이탈」 순서로 누르면 오른쪽 화면이 빈 데이터로 깨집니다.", "「가드 없이」를 끄면 같은 상황에서 가입 이어하기 화면으로 돌려보냅니다."],
    node: () => (
      <div className="flex justify-center md:[zoom:1.45]">
        <GuardMachine />
      </div>
    ),
  },
  omfres: {
    caseNo: 1,
    steps: ["「8명이 동시에 예약」을 누르세요. SET NX가 켜져 있으면 한 명만 성공하고 나머지는 409입니다.", "「SET NX 끄기」 후 다시 누르면 같은 자리에 여러 명이 예약됩니다."],
    node: () => (
      <div className="flex justify-center md:[zoom:1.25]">
        <RaceSim className="max-w-[560px]" />
      </div>
    ),
  },
};

export const hasSim = (p: Project) => p.slug in SIMS;

export function SimSection({ p }: { p: Project }) {
  const s = SIMS[p.slug];
  if (!s) return null;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line p-5">
        <p className="text-sm">
          <span className="font-mono mr-2 text-accent">{String(s.caseNo).padStart(2, "0")}</span>
          <b>{p.cases[s.caseNo - 1]?.title}</b>를 그대로 재현했습니다. 이렇게 눌러 보세요.
        </p>
        <ol className="mt-3 space-y-1.5 text-sm text-muted">
          {s.steps.map((t, i) => (
            <li key={t} className="grid grid-cols-[1.5rem_1fr]">
              <span className="font-mono text-accent">{i + 1}.</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>
      {s.node()}
    </div>
  );
}
