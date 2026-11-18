"use client";

import { useState } from "react";
import { ActionButton, BugSwitch, OK, SimShell, Verdict, useDanger } from "./simKit";

/* NADOK 사례 2 재현: 배포할 때마다 흰 화면.
   화면별 코드 분할 후 새 버전을 배포하면 옛 파일(BookPage-a1b2.js)이 사라진다.
   앱을 열어 둔 사용자가 다른 화면으로 가면 사라진 파일을 요청해 하얗게 깨진다.
   수정: 없는 파일은 404로 응답하고, 화면 파일을 못 받으면 한 번만 새로고침해 새 버전을 받는다. */

type Phase = "open" | "deployed" | "white" | "reloaded" | "ok";

export function NadokSim() {
  const danger = useDanger();
  const [bug, setBug] = useState(true);
  const [phase, setPhase] = useState<Phase>("open");
  const [log, setLog] = useState<{ text: string; tone: "ok" | "bad" | "info" }[]>([{ text: "앱 열림 · v1 (BookPage-a1b2.js를 쓰는 버전)", tone: "info" }]);

  const reset = () => {
    setPhase("open");
    setLog([{ text: "앱 열림 · v1 (BookPage-a1b2.js를 쓰는 버전)", tone: "info" }]);
  };
  const deploy = () => {
    setPhase("deployed");
    setLog((l) => [...l, { text: "새 버전 배포 · v2 — BookPage-a1b2.js 삭제, BookPage-c3d4.js 생성", tone: "info" }]);
  };
  const navigate = () => {
    if (phase === "open") {
      setLog((l) => [...l, { text: "GET /assets/BookPage-a1b2.js → 200 (배포 전이라 정상)", tone: "ok" }]);
      setPhase("ok");
      return;
    }
    if (bug) {
      setLog((l) => [
        ...l,
        { text: "GET /assets/BookPage-a1b2.js → index.html이 대신 옴 (MIME text/html)", tone: "bad" },
        { text: "화면 모듈 로드 실패 · 처리하는 곳 없음", tone: "bad" },
      ]);
      setPhase("white");
    } else {
      setLog((l) => [
        ...l,
        { text: "GET /assets/BookPage-a1b2.js → 404", tone: "bad" },
        { text: "로드 실패 감지 → 한 번만 새로고침", tone: "info" },
        { text: "v2 로드 · GET /assets/BookPage-c3d4.js → 200", tone: "ok" },
      ]);
      setPhase("reloaded");
    }
  };

  const white = phase === "white";

  return (
    <SimShell label="NADOK 배포 직후 흰 화면 재현">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={deploy} disabled={phase !== "open"}>
            ① 새 버전 배포
          </ActionButton>
          <ActionButton primary onClick={navigate} disabled={phase === "white" || phase === "reloaded" || phase === "ok"}>
            ② 책 상세로 이동
          </ActionButton>
          <ActionButton onClick={reset}>처음부터</ActionButton>
        </div>
        <BugSwitch
          on={bug}
          onChange={(v) => {
            setBug(v);
            reset();
          }}
          label="새로고침 가드 끄기 (수정 전)"
        />
      </div>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row">
        <div
          className="mx-auto flex h-[230px] w-[130px] shrink-0 flex-col rounded-[20px] border p-[6px] transition-colors"
          style={{ borderColor: white ? danger : "var(--line)", background: white ? "#ffffff" : "var(--card)" }}
          aria-hidden
        >
          <div className="mx-auto mb-2 h-[3px] w-6 rounded-full bg-line" />
          {white ? (
            <div className="flex flex-1 items-end justify-center pb-3 text-[10px] font-semibold" style={{ color: danger }}>
              (빈 화면)
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-2 px-1">
              <div className="flex items-center justify-between text-[9px]">
                <span className="font-bold" style={{ color: "#c9a227" }}>
                  NADOK
                </span>
                <span className="font-mono rounded border border-line px-1 text-muted">{phase === "reloaded" ? "v2" : "v1"}</span>
              </div>
              {phase === "ok" || phase === "reloaded" ? (
                <>
                  <div className="h-16 rounded bg-[#7aa36a]/60" />
                  <div className="h-2 w-3/4 rounded-full bg-line" />
                  <div className="h-2 w-1/2 rounded-full bg-line" />
                  <span className="mt-auto pb-2 text-center text-[9px]" style={{ color: OK }}>
                    책 상세 열림
                  </span>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="h-9 rounded bg-line" />
                    ))}
                  </div>
                  <span className="mt-auto pb-2 text-center text-[9px] text-muted">서재 화면</span>
                </>
              )}
            </div>
          )}
        </div>
        <ol className="font-mono min-w-0 flex-1 space-y-1.5 rounded-xl border border-line bg-card/50 p-3 text-xs">
          {log.map((l, i) => (
            <li key={i} style={{ color: l.tone === "ok" ? OK : l.tone === "bad" ? danger : "var(--fg)" }}>
              {l.text}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-4">
        {white ? (
          <Verdict tone="bad">흰 화면 — 사용자는 앱이 고장 난 줄 알고 닫아 버려요</Verdict>
        ) : phase === "reloaded" ? (
          <Verdict tone="ok">한 번 새로고침으로 새 버전을 받아 그대로 이어서 볼 수 있어요</Verdict>
        ) : phase === "ok" ? (
          <Verdict tone="idle">배포 전에는 문제가 없어요. 「처음부터」를 누르고 ①을 먼저 눌러 보세요.</Verdict>
        ) : (
          <Verdict tone="idle">① 배포 → ② 이동 순서로 눌러 보세요.</Verdict>
        )}
      </div>
    </SimShell>
  );
}
