"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { usePrefersReducedMotion, useTheme } from "@/lib/useEnv";

/* MCM Boarding Pass에서 실제로 고친 버그를 상태 기계로 만든 위젯.
   카카오로 가입만 하고 프로필 입력에서 이탈한 사용자를 "토큰만 있음"이라는
   별도 상태로 인정하지 않으면 보호 화면이 빈 데이터로 렌더된다.
   ProtectedRoute가 프로필 완성 여부까지 보게 만든 것이 수정 내용이다. */

type StateId = "anon" | "token" | "profile";
type EventId = "login" | "drop" | "done" | "logout";
type Pt = readonly [number, number];

/* 팔레트에 위험(빨강) 토큰이 없고 globals.css는 건드릴 수 없어서
   "깨진 화면"용 빨강만 여기서 테마별로 들고 있는다. 둘 다 카드 배경 대비 4.5:1 이상. */
const DANGER = { dark: "#ff7a6b", light: "#c0392b" } as const;

/* ---------- 다이어그램 좌표 (viewBox 240 x 152) ---------- */

const NODES: Record<StateId, { x: number; y: number; w: number; h: number; label: string; sub: string }> = {
  anon: { x: 28, y: 4, w: 112, h: 30, label: "비로그인", sub: "토큰 없음" },
  token: { x: 28, y: 61, w: 112, h: 30, label: "토큰만 있음", sub: "프로필 비어 있음" },
  profile: { x: 28, y: 118, w: 112, h: 30, label: "프로필 완성", sub: "가드 통과" },
};

const ORDER: StateId[] = ["anon", "token", "profile"];

/** 3차 베지어를 폴리라인으로 샘플링. 자기 루프 위를 토큰이 따라가게 하려고 쓴다. */
function sampleCubic(p0: Pt, c1: Pt, c2: Pt, p3: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    out.push([
      m * m * m * p0[0] + 3 * m * m * t * c1[0] + 3 * m * t * t * c2[0] + t * t * t * p3[0],
      m * m * m * p0[1] + 3 * m * m * t * c1[1] + 3 * m * t * t * c2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

const LOOP_D = "M140 68 C166 61 167 91 141 84";
const LOOP_PTS = sampleCubic([140, 68], [166, 61], [167, 91], [141, 84], 14);

/* 그려지는 간선. logout은 왼쪽 세로 레인 하나를 token/profile이 함께 쓴다. */
const EDGES: { id: EventId; d: string; stub?: string }[] = [
  { id: "login", d: "M84 34 V58" },
  { id: "done", d: "M84 91 V115" },
  { id: "drop", d: LOOP_D },
  { id: "logout", d: "M28 133 H20 Q14 133 14 127 V25 Q14 19 20 19 H26", stub: "M28 76 H14" },
];

/* (현재 상태 + 이벤트) → 토큰이 지나갈 경로 */
const TRACKS: Record<string, Pt[]> = {
  "anon:login": [
    [84, 34],
    [84, 61],
  ],
  "token:drop": LOOP_PTS,
  "token:done": [
    [84, 91],
    [84, 118],
  ],
  "token:logout": [
    [28, 76],
    [14, 76],
    [14, 19],
    [28, 19],
  ],
  "profile:logout": [
    [28, 133],
    [14, 133],
    [14, 19],
    [28, 19],
  ],
};

const EVENTS: { id: EventId; label: string; desc: string; from: StateId[]; to: StateId }[] = [
  { id: "login", label: "카카오 로그인", desc: "비로그인에서 토큰만 있음 상태로", from: ["anon"], to: "token" },
  {
    id: "drop",
    label: "온보딩 이탈",
    desc: "프로필을 채우지 않고 나가도 토큰만 있음 상태가 그대로 유지됨",
    from: ["token"],
    to: "token",
  },
  { id: "done", label: "프로필 완성", desc: "토큰만 있음에서 프로필 완성 상태로", from: ["token"], to: "profile" },
  { id: "logout", label: "로그아웃", desc: "비로그인 상태로 돌아감", from: ["token", "profile"], to: "anon" },
];

const SCREEN_LABEL: Record<StateId | "broken", string> = {
  anon: "로그인 화면",
  token: "가입 이어하기",
  profile: "정상 화면",
  broken: "빈 데이터로 깨짐",
};

/* ---------- 토큰(움직이는 점) ---------- */

/** 폴리라인의 누적 길이. 구간 길이에 비례해 움직이도록 미리 잰다. */
function measure(pts: readonly Pt[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { cum, total: cum[cum.length - 1] || 1 };
}

/** 0..1 진행도를 폴리라인 좌표로. 스프링 오버슈트는 양 끝에서 잘라 낸다. */
function pointAt(pts: readonly Pt[], cum: number[], total: number, u: number, axis: 0 | 1) {
  const d = (u < 0 ? 0 : u > 1 ? 1 : u) * total;
  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i++;
  const seg = cum[i] - cum[i - 1] || 1;
  const k = (d - cum[i - 1]) / seg;
  return pts[i - 1][axis] + (pts[i][axis] - pts[i - 1][axis]) * k;
}

function Token({ track, color }: { track: Pt[]; color: string }) {
  const t = useMotionValue(0);
  const m = useMemo(() => measure(track), [track]);
  const x = useTransform(t, (u) => pointAt(track, m.cum, m.total, u, 0));
  const y = useTransform(t, (u) => pointAt(track, m.cum, m.total, u, 1));

  // 전이마다 key로 새로 마운트된다. 렌더 중이 아니라 effect 안에서만 값을 민다.
  useEffect(() => {
    const ctrl = animate(t, 1, { type: "spring", stiffness: 150, damping: 18, mass: 0.7 });
    return () => ctrl.stop();
  }, [t]);

  return (
    <motion.g
      style={{ x, y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.78, times: [0, 0.1, 0.72, 1], ease: "linear" }}
      aria-hidden
    >
      <circle r="9" fill={color} opacity="0.18" />
      <circle r="4" fill={color} />
    </motion.g>
  );
}

/* ---------- 폰 안에 그리는 스켈레톤 화면 ---------- */

function Screen({ kind, danger }: { kind: StateId | "broken"; danger: string }) {
  const amber = { background: "var(--accent)", color: "var(--bg)" };

  if (kind === "anon") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-[6px] px-[6px]">
        <div className="h-6 w-6 rounded-full border border-line" />
        <div className="h-[5px] w-3/4 rounded-full bg-line" />
        <div className="h-[5px] w-1/2 rounded-full bg-line" />
        <div className="mt-1 flex h-[18px] w-full items-center justify-center rounded-[6px] text-[7px] font-bold" style={amber}>
          카카오 로그인
        </div>
      </div>
    );
  }

  if (kind === "token") {
    return (
      <div className="flex h-full flex-col gap-[6px] px-[6px] pt-[6px]">
        <div className="flex items-center justify-between">
          <span className="text-[7px] font-bold" style={{ color: "var(--accent)" }}>
            STEP 2/3
          </span>
          <span className="text-[6.5px] text-muted">프로필</span>
        </div>
        <div className="h-[5px] w-2/3 rounded-full bg-line" />
        <div className="h-[16px] rounded-[5px] border border-line" />
        <div className="h-[16px] rounded-[5px] border border-line" />
        <div className="mb-[6px] mt-auto flex h-[16px] items-center justify-center rounded-[5px] text-[7px] font-bold" style={amber}>
          이어서 작성
        </div>
      </div>
    );
  }

  if (kind === "profile") {
    return (
      <div className="flex h-full flex-col gap-[5px] px-[6px] pt-[6px]">
        <span className="text-[6px] tracking-[0.18em] text-muted">BOARDING PASS</span>
        <div className="rounded-[6px] border border-line p-[5px]">
          <div className="flex items-end justify-between">
            <span className="font-display text-[10px] font-bold">HSU</span>
            <span className="text-[7px] text-muted">→</span>
            <span className="font-display text-[10px] font-bold">MCM</span>
          </div>
          <div className="my-[5px] border-t border-dashed border-line" />
          <div className="flex justify-between text-[6px]">
            <span className="text-muted">이름</span>
            <span>김헌영</span>
          </div>
        </div>
        <div className="mb-[6px] mt-auto flex items-center gap-[4px]">
          <span className="grid h-[13px] w-[13px] place-items-center rounded-full text-[7px] font-bold" style={amber}>
            ✓
          </span>
          <span className="text-[7px] text-muted">스탬프 발급</span>
        </div>
      </div>
    );
  }

  // 가드가 없을 때: 토큰만 보고 통과시켜 빈 프로필로 렌더된 화면
  return (
    <div className="flex h-full flex-col gap-[6px] px-[6px] pt-[6px]">
      <div className="h-[5px] w-1/2 rounded-full" style={{ background: danger, opacity: 0.4 }} />
      <div className="rounded-[6px] border border-dashed p-[5px]" style={{ borderColor: danger }}>
        <div className="flex justify-between text-[6px]">
          <span className="text-muted">이름</span>
          <span style={{ color: danger }}>undefined</span>
        </div>
        <div className="mt-[4px] flex justify-between text-[6px]">
          <span className="text-muted">여권번호</span>
          <span style={{ color: danger }}>—</span>
        </div>
      </div>
      <div className="h-px w-full" style={{ background: danger }} />
      <div className="mb-[6px] mt-auto text-center text-[7.5px] font-bold" style={{ color: danger }}>
        빈 데이터로 깨짐
      </div>
    </div>
  );
}

/* ---------- 본체 ---------- */

export function GuardMachine({ className = "" }: { className?: string }) {
  const reduced = usePrefersReducedMotion();
  const theme = useTheme();
  // useId 결과에는 콜론이 들어가므로 url(#id) 참조용으로 영숫자만 남긴다.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const [state, setState] = useState<StateId>("anon");
  const [guardOff, setGuardOff] = useState(false);
  const [move, setMove] = useState<{ id: number; track: Pt[]; edge: EventId } | null>(null);

  const danger = theme === "light" ? DANGER.light : DANGER.dark;
  const broken = guardOff && state === "token";
  const screen: StateId | "broken" = broken ? "broken" : state;
  const activeColor = broken ? danger : "var(--accent)";
  const hotEdge = move?.edge ?? null;

  function fire(ev: (typeof EVENTS)[number]) {
    if (!ev.from.includes(state)) return;
    const track = TRACKS[`${state}:${ev.id}`];
    if (!track) return;
    setMove((prev) => ({ id: (prev?.id ?? 0) + 1, track, edge: ev.id }));
    setState(ev.to);
  }

  return (
    <div
      className={`w-full max-w-[420px] rounded-2xl border border-line bg-bg/70 p-3 backdrop-blur ${className}`}
      role="group"
      aria-label="3-상태 인증 가드 시뮬레이터. Esc를 누르면 비로그인 상태로 돌아갑니다."
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        setState("anon");
        setMove(null);
      }}
    >
      {/* 머리말: 현재 상태와 사용자가 보는 화면을 aria-live로 읽어 준다 */}
      <div className="flex items-center justify-between gap-2">
        <p aria-live="polite" className="min-w-0 truncate text-[11px] font-semibold leading-tight">
          <span style={{ color: activeColor }}>{NODES[state].label}</span>
          <span className="text-muted"> · {SCREEN_LABEL[screen]}</span>
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={guardOff}
          aria-label="가드 없이 동작 보기"
          onClick={() => setGuardOff((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2 py-1 text-[10px] transition-colors hover:border-accent"
        >
          <span className={guardOff ? "font-semibold" : "text-muted"}>가드 없이</span>
          <span
            className="relative block h-[12px] w-[22px] rounded-full transition-colors"
            style={{ background: guardOff ? danger : "var(--line)" }}
            aria-hidden
          >
            <span
              className="absolute top-[2px] block h-[8px] w-[8px] rounded-full transition-all duration-200"
              style={{ left: guardOff ? 12 : 2, background: guardOff ? "var(--bg)" : "var(--muted)" }}
            />
          </span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 max-[400px]:flex-col max-[400px]:justify-start">
        {/* 다이어그램. 상태와 화면은 위 텍스트가 전달하므로 그림 자체는 장식으로 둔다 */}
        <svg
          viewBox="0 0 240 152"
          preserveAspectRatio="xMidYMid meet"
          className="h-[150px] w-full min-w-0 max-w-[252px] flex-1 max-[400px]:h-[118px] max-[400px]:max-w-none"
          aria-hidden
        >
          <defs>
            <marker id={`${uid}-dim`} viewBox="0 0 8 8" refX="8" refY="4" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" fill="var(--line)" />
            </marker>
            <marker id={`${uid}-on`} viewBox="0 0 8 8" refX="8" refY="4" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M0 0 L8 4 L0 8 Z" fill="var(--accent)" />
            </marker>
          </defs>

          {EDGES.map((e) => {
            const on = hotEdge === e.id;
            const stroke = on ? "var(--accent)" : "var(--line)";
            const marker = `url(#${uid}-${on ? "on" : "dim"})`;
            return (
              <g key={e.id} style={{ transition: "stroke 0.3s ease" }}>
                <path d={e.d} fill="none" stroke={stroke} strokeWidth={on ? 1.8 : 1.2} markerEnd={marker} />
                {e.stub && <path d={e.stub} fill="none" stroke={stroke} strokeWidth={on ? 1.8 : 1.2} />}
              </g>
            );
          })}

          {/* 간선 이름 */}
          <text x="92" y="50" fontSize="9.5" fill="var(--muted)">
            카카오 로그인
          </text>
          <text x="92" y="107" fontSize="9.5" fill="var(--muted)">
            프로필 완성
          </text>
          <text x="172" y="74" fontSize="9.5" fill="var(--muted)">
            온보딩 이탈
          </text>
          <text x="172" y="86" fontSize="7.5" fill="var(--muted)" opacity="0.75">
            상태 그대로
          </text>
          {/* 세로 레인 옆에 세워 붙인 이름. 회전 기준점을 x=9로 둬야 글자가 왼쪽에서 잘리지 않는다 */}
          <text x="9" y="76" fontSize="9.5" fill="var(--muted)" textAnchor="middle" transform="rotate(-90 9 76)">
            로그아웃
          </text>

          {/* 상태 노드 */}
          {ORDER.map((id) => {
            const n = NODES[id];
            const on = state === id;
            const col = on ? (broken && id === "token" ? danger : "var(--accent)") : "var(--line)";
            return (
              <g key={id}>
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx="9"
                  fill={col}
                  fillOpacity={on ? 0.13 : 0}
                  stroke={col}
                  strokeWidth={on ? 1.7 : 1}
                  style={{ transition: "fill 0.3s ease, stroke 0.3s ease, fill-opacity 0.3s ease" }}
                />
                <text
                  x={n.x + n.w / 2}
                  y={n.y + 13}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="700"
                  fill={on ? col : "var(--fg)"}
                  style={{ transition: "fill 0.3s ease" }}
                >
                  {n.label}
                </text>
                <text x={n.x + n.w / 2} y={n.y + 23} textAnchor="middle" fontSize="7.5" fill="var(--muted)">
                  {n.sub}
                </text>
              </g>
            );
          })}

          {/* 모션 최소화면 움직이는 토큰 없이 노드만 즉시 바뀐다 */}
          {!reduced && move && <Token key={move.id} track={move.track} color={broken ? danger : "var(--accent)"} />}
        </svg>

        {/* 그 상태에서 사용자가 실제로 보는 화면 */}
        <div
          className="flex h-[150px] w-[92px] shrink-0 flex-col rounded-[16px] border p-[4px] transition-colors"
          style={{ borderColor: broken ? danger : "var(--line)", background: "var(--card)" }}
          aria-hidden
        >
          <div className="mx-auto mb-[4px] mt-[2px] h-[3px] w-5 shrink-0 rounded-full bg-line" />
          <div className="min-h-0 flex-1">
            <Screen kind={screen} danger={danger} />
          </div>
        </div>
      </div>

      {/* 이벤트 버튼. 지금 상태에서 못 일어나는 이벤트도 포커스는 잃지 않게 aria-disabled로만 표시 */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {EVENTS.map((ev) => {
          const can = ev.from.includes(state);
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => fire(ev)}
              aria-disabled={!can}
              aria-label={`${ev.label}. ${ev.desc}${can ? "" : ". 지금 상태에서는 일어나지 않습니다"}`}
              className={`rounded-full border border-line px-2.5 py-1.5 text-[10px] font-semibold transition-colors ${
                can ? "hover:border-accent hover:text-accent" : "cursor-default text-muted opacity-45"
              }`}
            >
              {ev.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
