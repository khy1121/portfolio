"use client";

import { useState, type ReactNode } from "react";
import { ActionButton, BugSwitch, SimShell, Verdict } from "./simKit";

/* Cropy 사례 2 재현: 자꾸 헷갈리는 병해 한 쌍.
   오분류의 59%가 무 검은무늬병 ↔ 무 노균병에 몰려 있었다.
   두 후보의 신뢰도 차이가 작으면 결과를 하나로 단정하지 않고, 구분에 필요한 부위를 다시 찍게 해 두 결과를 합친다.
   (수치는 시연용 예시) */

type Sample = { id: string; label: string; scores: [number, number]; truth: 0 | 1; retake: [number, number] };
const NAMES = ["무 검은무늬병", "무 노균병"] as const;
const SAMPLES: Sample[] = [
  { id: "clear", label: "선명한 잎 사진", scores: [0.86, 0.07], truth: 0, retake: [0.88, 0.05] },
  { id: "close", label: "애매한 잎 사진", scores: [0.47, 0.41], truth: 1, retake: [0.18, 0.74] },
];
const GAP = 0.15; // 이 차이보다 작으면 접전

function Bar({ name, v, hi }: { name: string; v: number; hi: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className={hi ? "font-semibold" : "text-muted"}>{name}</span>
        <span className="font-mono">{Math.round(v * 100)}%</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-line">
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${v * 100}%`, background: hi ? "var(--accent)" : "var(--muted)" }} />
      </div>
    </div>
  );
}

export function CropySim() {
  const [bug, setBug] = useState(true);
  const [sample, setSample] = useState<Sample | null>(null);
  const [retaken, setRetaken] = useState(false);

  const pick = (s: Sample) => {
    setSample(s);
    setRetaken(false);
  };

  let body: ReactNode = <Verdict tone="idle">사진을 하나 골라 진단해 보세요. 「애매한 잎 사진」이 문제의 상황입니다.</Verdict>;
  let scores: [number, number] | null = null;

  if (sample) {
    const s = retaken ? ([(sample.scores[0] + sample.retake[0]) / 2, (sample.scores[1] + sample.retake[1]) / 2] as [number, number]) : sample.scores;
    scores = s;
    const top = s[0] >= s[1] ? 0 : 1;
    const close = Math.abs(s[0] - s[1]) < GAP;
    if (!bug && close && !retaken) {
      body = (
        <div className="space-y-3">
          <Verdict tone="idle">두 병해가 비슷해요({Math.round(Math.abs(s[0] - s[1]) * 100)}%p 차이). 결과를 단정하지 않고 잎 뒷면을 한 장 더 찍어 달라고 안내합니다.</Verdict>
          <ActionButton primary onClick={() => setRetaken(true)}>
            잎 뒷면 추가 촬영
          </ActionButton>
        </div>
      );
    } else if (top === sample.truth) {
      body = (
        <Verdict tone="ok">
          진단: {NAMES[top]}
          {retaken ? " — 두 사진을 합쳐 확정, 실제와 일치" : " — 실제와 일치"}
        </Verdict>
      );
    } else {
      body = <Verdict tone="bad">진단: {NAMES[top]} — 실제로는 {NAMES[sample.truth]}. 엉뚱한 농약을 추천하게 돼요</Verdict>;
    }
  }

  return (
    <SimShell label="Cropy 접전 판정 재현">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <ActionButton key={s.id} primary={sample?.id === s.id} onClick={() => pick(s)}>
              {s.label}
            </ActionButton>
          ))}
        </div>
        <BugSwitch
          on={bug}
          onChange={(v) => {
            setBug(v);
            setRetaken(false);
          }}
          label="접전 판정 끄기 (수정 전)"
        />
      </div>

      <div className="mt-5 grid gap-3 rounded-xl border border-line bg-card/50 p-4" style={{ borderColor: sample && !bug && !retaken && scores && Math.abs(scores[0] - scores[1]) < GAP ? "var(--accent)" : undefined }}>
        {scores ? (
          <>
            <Bar name={NAMES[0]} v={scores[0]} hi={scores[0] >= scores[1]} />
            <Bar name={NAMES[1]} v={scores[1]} hi={scores[1] > scores[0]} />
            {retaken && <p className="font-mono text-[11px] text-muted">첫 사진 + 잎 뒷면 사진의 평균</p>}
          </>
        ) : (
          <p className="text-xs text-muted">모델 신뢰도가 여기에 표시됩니다.</p>
        )}
      </div>

      <div className="mt-4">{body}</div>
      <p className="mt-3 text-[11px]" style={{ color: "var(--muted)" }}>
        수치는 시연용 예시입니다. 실제 모델은 오분류 44건 중 26건이 이 한 쌍에 몰려 있었습니다.
      </p>
    </SimShell>
  );
}
