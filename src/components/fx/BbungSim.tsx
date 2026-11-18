"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/useEnv";
import { ActionButton, BugSwitch, OK, SimShell, Verdict, useDanger } from "./simKit";

/* 붕붕어스 사례 1 재현: 앱을 다시 열면 첫 요청이 401.
   React는 자식 화면의 effect를 App의 세션 복구 effect보다 먼저 실행한다.
   토큰을 초기화 단계에서 미리 싣지 않으면 홈·드라이브 조회가 토큰 없이 나간다. */

type Line = { at: number; who: string; text: string; tone: "ok" | "bad" | "info" };

function timeline(primed: boolean): Line[] {
  const head: Line[] = primed
    ? [{ at: 0, who: "초기화", text: "저장된 토큰을 API 클라이언트에 미리 실음", tone: "info" }]
    : [{ at: 0, who: "초기화", text: "로그인 상태만 확인 (토큰은 아직 안 실음)", tone: "info" }];
  const auth = primed ? "Authorization: Bearer …" : "Authorization 없음";
  return [
    ...head,
    { at: 1, who: "홈 화면 effect", text: `GET /home · ${auth}`, tone: "info" },
    { at: 2, who: "드라이브 배너 effect", text: `GET /drives/active · ${auth}`, tone: "info" },
    { at: 3, who: "응답", text: primed ? "200 OK · 홈 데이터" : "401 Unauthorized", tone: primed ? "ok" : "bad" },
    { at: 4, who: "응답", text: primed ? "200 OK · 진행 중 드라이브" : "401 Unauthorized", tone: primed ? "ok" : "bad" },
    { at: 5, who: "App effect", text: primed ? "세션 복구 (이미 준비됨)" : "세션 복구 → 이제야 토큰을 실음", tone: "info" },
  ];
}

export function BbungSim() {
  const reduced = usePrefersReducedMotion();
  const danger = useDanger();
  const [bug, setBug] = useState(true);
  const [shown, setShown] = useState(0);
  const [ran, setRan] = useState<boolean | null>(null); // 마지막 실행 때의 primed 여부
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const lines = ran === null ? [] : timeline(ran);

  const run = () => {
    timers.current.forEach(clearTimeout);
    const primed = !bug;
    setRan(primed);
    const n = timeline(primed).length;
    if (reduced) {
      setShown(n);
      return;
    }
    setShown(0);
    timers.current = Array.from({ length: n }, (_, i) => window.setTimeout(() => setShown(i + 1), 380 * (i + 1)));
  };

  const done = ran !== null && shown >= lines.length;

  return (
    <SimShell label="붕붕어스 첫 요청 401 재현">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActionButton primary onClick={run}>
          앱 다시 열기
        </ActionButton>
        <BugSwitch on={bug} onChange={setBug} label="토큰 미리 싣기 끄기 (수정 전)" />
      </div>

      <ol className="font-mono mt-5 min-h-[13.5rem] space-y-1.5 rounded-xl border border-line bg-card/50 p-3 text-xs">
        {ran === null && <li className="text-muted">「앱 다시 열기」를 눌러 실행 순서를 확인해 보세요.</li>}
        {lines.slice(0, shown).map((l, i) => (
          <li key={i} className="grid grid-cols-[8.5rem_1fr] gap-3">
            <span className="text-muted">{l.who}</span>
            <span style={{ color: l.tone === "ok" ? OK : l.tone === "bad" ? danger : "var(--fg)" }}>{l.text}</span>
          </li>
        ))}
      </ol>

      <div className="mt-4">
        {!done ? (
          <Verdict tone="idle">자식 화면의 요청이 App의 세션 복구보다 먼저 나갑니다.</Verdict>
        ) : ran ? (
          <Verdict tone="ok">토큰을 미리 실어 두어 첫 요청부터 200 — 사용자는 아무 일도 느끼지 못해요</Verdict>
        ) : (
          <Verdict tone="bad">첫 요청 두 개가 401 — 로그인했는데도 홈이 비거나 로그아웃된 것처럼 보여요</Verdict>
        )}
      </div>
    </SimShell>
  );
}
