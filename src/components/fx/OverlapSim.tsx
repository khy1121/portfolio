"use client";

import { useState } from "react";
import { ActionButton, BugSwitch, SimShell, Verdict, useDanger } from "./simKit";

/* Overlap 사례 1 재현: 여러 명이 동시에 칠하는 시간표.
   실시간 동기화가 꺼져 있으면 내가 보는 민지의 일정은 처음 불러온 그대로라,
   민지가 일정을 바꿔도 추천 시간이 옛 정보로 계산된다. 켜 두면 바뀐 즉시 반영된다. */

const DAYS = ["월", "화", "수", "목", "금"];
const HOURS = ["14", "15", "16", "17"];
const key = (d: number, h: number) => `${d}-${h}`;
const FRIEND_START = new Set(["0-1", "0-2", "2-0", "2-1", "3-2"]);
const FRIEND_CHANGED = new Set(["2-0", "3-2", "3-3", "4-1"]); // 월요일을 비우고 목·금을 추가

function first(a: Set<string>, b: Set<string>) {
  for (let d = 0; d < DAYS.length; d++) for (let h = 0; h < HOURS.length; h++) if (a.has(key(d, h)) && b.has(key(d, h))) return key(d, h);
  return null;
}
const label = (k: string) => {
  const [d, h] = k.split("-").map(Number);
  return `${DAYS[d]} ${HOURS[h]}:00`;
};

function Grid({ title, cells, mine, onToggle, stale }: { title: string; cells: Set<string>; mine?: boolean; onToggle?: (k: string) => void; stale?: boolean }) {
  const danger = useDanger();
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold">
        {title}
        {stale && (
          <span className="font-mono rounded border px-1.5 py-0.5 text-[10px]" style={{ borderColor: danger, color: danger }}>
            처음 불러온 그대로
          </span>
        )}
      </p>
      <div className="grid grid-cols-[1.6rem_repeat(5,1fr)] gap-1 text-[10px]">
        <span />
        {DAYS.map((d) => (
          <span key={d} className="text-center text-muted">
            {d}
          </span>
        ))}
        {HOURS.map((h, hi) => (
          <div key={h} className="contents">
            <span className="font-mono self-center text-muted">{h}</span>
            {DAYS.map((_, di) => {
              const k = key(di, hi);
              const on = cells.has(k);
              const Cell = mine ? "button" : "span";
              return (
                <Cell
                  key={k}
                  {...(mine ? { type: "button" as const, onClick: () => onToggle?.(k), "aria-pressed": on, "aria-label": `${DAYS[di]} ${h}시 ${on ? "가능" : "비어 있음"}` } : {})}
                  className={`h-7 rounded-[4px] border transition-colors ${on ? "border-transparent" : "border-line"} ${mine ? "hover:border-accent" : ""}`}
                  style={{ background: on ? (mine ? "var(--accent)" : "#34c38f") : "transparent", opacity: on ? 0.9 : 1 }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverlapSim() {
  const [me, setMe] = useState<Set<string>>(new Set(["0-1", "2-0", "3-2"]));
  const [server, setServer] = useState<Set<string>>(FRIEND_START);
  const [syncOff, setSyncOff] = useState(false);
  const [snapshot, setSnapshot] = useState<Set<string>>(FRIEND_START);

  const seen = syncOff ? snapshot : server;
  const rec = first(me, seen);
  const reallyOk = rec ? server.has(rec) : false;
  const changed = server === FRIEND_CHANGED;

  const toggle = (k: string) =>
    setMe((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <SimShell label="Overlap 실시간 시간표 재현">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <ActionButton primary onClick={() => setServer(changed ? FRIEND_START : FRIEND_CHANGED)}>
            {changed ? "민지 일정 되돌리기" : "민지가 일정 바꾸기"}
          </ActionButton>
        </div>
        <BugSwitch
          on={syncOff}
          label="실시간 동기화 끄기"
          onChange={(v) => {
            setSyncOff(v);
            setSnapshot(server);
          }}
        />
      </div>

      <div className="mt-5 flex flex-col gap-6 sm:flex-row">
        <Grid title="나 (눌러서 칠하기)" cells={me} mine onToggle={toggle} />
        <Grid title="내 화면에 보이는 민지" cells={seen} stale={syncOff && snapshot !== server} />
      </div>

      <div className="mt-5">
        {!rec ? (
          <Verdict tone="idle">겹치는 칸이 없어요. 내 칸을 더 칠해 보세요.</Verdict>
        ) : reallyOk ? (
          <Verdict tone="ok">추천: {label(rec)} — 실제로 둘 다 가능해요</Verdict>
        ) : (
          <Verdict tone="bad">추천: {label(rec)} — 하지만 민지는 이미 이 시간을 비웠어요. 결국 메신저로 다시 물어봐야 해요</Verdict>
        )}
      </div>
    </SimShell>
  );
}
