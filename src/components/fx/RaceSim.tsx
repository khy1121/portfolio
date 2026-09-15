"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { mulberry32 } from "@/lib/rng";
import { useCoarsePointer, useInView, useNarrowViewport, usePrefersReducedMotion } from "@/lib/useEnv";

/* 동시 예약 레이스 시뮬레이터.
   omfres가 실제로 쓰는 슬롯 선점 로직을 같은 요청 집합으로 두 번 돌려 비교한다.
   · SET NX  : 검사와 쓰기가 한 번에 끝나므로 먼저 도착한 1건만 201, 나머지는 409
   · GET → SET : 검사와 쓰기 사이 WINDOW_MS 동안 도착한 요청도 빈 슬롯을 보고 같이 201을 받는다
   서버를 실제로 호출하지 않는 시각화라서 "시뮬레이션" 태그를 붙여 둔다. */

const COUNT = 8;
const WINDOW_MS = 60; // 검사 → 쓰기 사이의 빈틈
const SPAN = 1500; // 전체 연출 길이(ms)
const LAT_MIN = 40;
const LAT_SPREAD = 260; // 같은 순간에 누른 상황이라 지연 폭을 좁게 잡는다
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Req = { id: number; lat: number; rank: number; ok: boolean; dup: boolean };

function latencies(seed: number) {
  const rand = mulberry32(seed);
  return Array.from({ length: COUNT }, () => LAT_MIN + rand() * LAT_SPREAD);
}

/* 실행 횟수를 시드로 써서 매번 다르되 재현 가능하게 만든다.
   경합이 눈에 보여야 의미가 있으므로 검사-쓰기 구간에 3건이 겹치는 표본만 고른다. */
function latenciesForRun(run: number) {
  const base = run * 7919 + 101;
  let fallback = latencies(base);
  for (let k = 0; k < 64; k += 1) {
    const ls = latencies(base + k * 17);
    const first = Math.min(...ls);
    if (ls.filter((l) => l < first + WINDOW_MS).length === 3) return ls;
    fallback = ls;
  }
  return fallback;
}

function buildPlan(run: number, nx: boolean): Req[] {
  const ls = latenciesForRun(run);
  const order = ls.map((_, i) => i).sort((a, b) => ls[a] - ls[b]);
  const first = ls[order[0]];
  const rankOf = new Array<number>(COUNT);
  order.forEach((idx, r) => {
    rankOf[idx] = r;
  });
  return ls.map((lat, i) => {
    // NX면 1등만 통과한다. 끄면 1등이 쓰기를 끝내기 전에 도착한 요청도 전부 통과한다.
    const ok = nx ? rankOf[i] === 0 : lat < first + WINDOW_MS;
    return { id: i + 1, lat, rank: rankOf[i], ok, dup: ok && rankOf[i] !== 0 };
  });
}

/** 지연(ms)을 연출 전체 길이에 대한 비율로 옮긴다. */
const progressOf = (lat: number) => 0.1 + ((lat - LAT_MIN) / LAT_SPREAD) * 0.55;

export function RaceSim({ className = "" }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const narrow = useNarrowViewport();
  const inView = useInView(rootRef, "0px");

  const [nx, setNx] = useState(true);
  const [run, setRun] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");

  const plan = useMemo(() => buildPlan(run, nx), [run, nx]);
  // 도착 순서대로 공개한다. plan은 훅이 돌려준 값이라 복사해서 정렬한다.
  const byArrival = useMemo(() => [...plan].sort((a, b) => a.rank - b.rank), [plan]);
  // 모션을 끈 사용자나 화면 밖이면 바를 날리지 않고 결과만 보여 준다
  const animated = !reduced && inView;

  useEffect(() => {
    if (phase !== "running") return;
    if (!animated) {
      // effect 본문에서 setState를 즉시 부르지 않도록 rAF 한 프레임 뒤로 미룬다
      const id = requestAnimationFrame(() => {
        setRevealed(COUNT);
        setPhase("done");
      });
      return () => cancelAnimationFrame(id);
    }
    const timers = byArrival.map((r, i) =>
      window.setTimeout(
        () => {
          setRevealed(i + 1);
          if (i === COUNT - 1) setPhase("done");
        },
        progressOf(r.lat) * SPAN + 60,
      ),
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [phase, byArrival, animated]);

  // Escape는 남은 연출을 건너뛰고 결과를 바로 보여 준다
  useEffect(() => {
    if (phase !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setRevealed(COUNT);
      setPhase("done");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  // 로그는 항상 마지막 줄이 보이게 (읽기 1회, 쓰기 1회)
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [revealed]);

  const start = useCallback(() => {
    setRevealed(0);
    setRun((r) => r + 1);
    setPhase("running");
  }, []);

  const toggleNx = useCallback(() => {
    setNx((v) => !v);
    setRevealed(0);
    // 한 번이라도 돌렸다면 같은 요청 집합으로 다시 돌린다. 그래야 차이가 드러난다.
    setPhase((p) => (p === "idle" ? "idle" : "running"));
  }, []);

  const shown = byArrival.slice(0, revealed);
  const okShown = shown.filter((r) => r.ok).length;
  const dupShown = shown.filter((r) => r.dup).length;
  const claimed = okShown > 0;
  const done = phase === "done";

  const summary = nx
    ? `SET NX 켜짐. 요청 ${COUNT}건 중 1건만 201 CREATED, 나머지 ${COUNT - 1}건은 409 CONFLICT로 거부되었습니다.`
    : `SET NX 꺼짐. 요청 ${COUNT}건 중 ${okShown}건이 201 CREATED를 받아 중복 예약이 ${dupShown}건 생겼습니다.`;

  return (
    <div ref={rootRef} className={`rounded-2xl border border-line bg-bg/60 p-3.5 ${className}`}>
      <div className="flex items-center gap-2">
        <h4 className="text-[13px] font-semibold">동시 예약 레이스</h4>
        <span className="rounded-full border border-line px-1.5 py-px text-[10px] text-muted">시뮬레이션</span>
        <span className="ml-auto font-mono text-[10px] text-muted">{nx ? "SET NX" : "GET → SET"}</span>
      </div>

      {/* 트랙: 왼쪽에서 출발한 요청 8건이 서버 노드까지 달린다. 내용은 아래 로그와 같아서 숨긴다. */}
      <div className="relative mt-2 h-20" aria-hidden>
        <div
          className="absolute inset-y-0 right-[48px] w-[3px] rounded-full transition-colors duration-300"
          style={{ backgroundColor: claimed ? "var(--accent)" : "var(--line)" }}
        />
        {plan.map((r) => {
          const settled = revealed > r.rank;
          const f = progressOf(r.lat);
          const total = f + 0.3;
          return (
            <div key={r.id} className="relative h-[10px]">
              <div className="absolute right-[54px] left-0 top-[3px] h-[4px] rounded-full bg-line" />
              {phase !== "idle" && (
                <motion.div
                  key={`${run}-${nx ? "nx" : "raw"}-${r.id}`}
                  className="absolute right-[54px] left-0 top-[3px] h-[4px] origin-left rounded-full bg-fg/20 transition-colors duration-200"
                  style={settled ? { backgroundColor: r.ok ? "var(--accent)" : "var(--muted)" } : undefined}
                  initial={animated ? { scaleX: 0 } : false}
                  animate={
                    animated
                      ? r.ok
                        ? { scaleX: 1 }
                        : { scaleX: [0, 1, 1, 0] } // 도착했다가 409를 받고 되돌아간다
                      : { scaleX: r.ok ? 1 : 0.28 }
                  }
                  transition={
                    animated
                      ? r.ok
                        ? { duration: (f * SPAN) / 1000, ease: EASE }
                        : {
                            duration: (total * SPAN) / 1000,
                            times: [0, f / total, (f + 0.1) / total, 1],
                            ease: EASE,
                          }
                      : { duration: 0 }
                  }
                />
              )}
              <span
                className={`absolute right-0 top-0 font-mono text-[9px] leading-[10px] transition-opacity duration-200 ${
                  settled ? "opacity-100" : "opacity-0"
                } ${r.dup ? "text-rose-500" : r.ok ? "text-accent" : "text-muted"}`}
              >
                {r.ok ? "201" : "409"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px]">
        {phase === "idle" ? (
          <span className="text-muted">같은 14:00 슬롯에 요청 {COUNT}건을 동시에 보냅니다</span>
        ) : (
          <>
            <span className="tabular-nums text-accent">201 · {okShown}건</span>
            <span className="tabular-nums text-muted">409 · {shown.length - okShown}건</span>
            {dupShown > 0 && (
              <span className="ml-auto flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 tabular-nums">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                중복 예약 {dupShown}건
              </span>
            )}
          </>
        )}
      </div>

      <ol
        ref={logRef}
        aria-label="요청 로그"
        className="mt-2 h-[40px] overflow-x-hidden overflow-y-auto rounded-lg border border-line bg-card/70 px-2 py-1 font-mono text-[10px] leading-[14px]"
      >
        {shown.length === 0 && <li className="text-muted">{"// 대기 중"}</li>}
        {shown.map((r) => (
          <li key={r.id} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-muted">#{r.id}</span>
            <span>POST /api/reserve 14:00</span>
            <span className={`ml-auto ${r.ok ? "text-accent" : "text-muted"}`}>→ {r.ok ? "201" : "409"}</span>
            {r.dup && <span className="text-rose-500">중복</span>}
          </li>
        ))}
        {done && (
          <li className="text-muted">
            {nx ? "// SET NX: 검사와 쓰기가 한 번에 끝난다" : `// GET → SET: 그 사이 ${WINDOW_MS}ms가 비어 있다`}
          </li>
        )}
      </ol>

      {/* 좁은 화면에서는 두 버튼이 폭을 반씩 나눠 가져 탭 영역을 키운다(높이는 그대로) */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={start}
          aria-label={`${COUNT}명이 같은 14:00 슬롯을 동시에 예약하는 요청 보내기`}
          className={`flex-1 rounded-full bg-accent text-xs font-semibold text-bg ${coarse ? "px-4 py-2.5" : "px-3 py-2"}`}
        >
          {COUNT}명이 동시에 예약
        </button>
        <button
          type="button"
          onClick={toggleNx}
          aria-label={nx ? "SET NX 끄기" : "SET NX 켜기"}
          className={`rounded-full border border-line text-xs text-muted ${narrow ? "flex-1" : ""} ${
            coarse ? "px-4 py-2.5" : "px-3 py-2"
          }`}
        >
          SET NX {nx ? "끄기" : "켜기"}
        </button>
      </div>

      <p aria-live="polite" className="sr-only">
        {done ? summary : ""}
      </p>
    </div>
  );
}
