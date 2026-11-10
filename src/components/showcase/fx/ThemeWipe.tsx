"use client";

import { useEffect, useRef, useState } from "react";
import { mulberry32, seededArray } from "@/lib/rng";
import { readCssVar, useNarrowViewport, usePrefersReducedMotion } from "@/lib/useEnv";

/* 등고선 테마 전환.
   테마가 바뀌면 "직전 테마의 배경색"이 화면을 덮은 채 클릭 지점에서 바깥으로 물러나고,
   그 경계가 등고선 모양으로 일렁이며 앰버 선이 경계를 타고 흐른다. 약 760ms, 한 번만 재생. */

export const THEME_WIPE_EVENT = "theme-wipe";

export type ThemeWipeDetail = { x: number; y: number; to: "dark" | "light" };

/** 토글 핸들러에서 호출한다. 모션 최소화 상태면 아무것도 하지 않는다. */
export function playThemeWipe(x: number, y: number, to: "dark" | "light") {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.dispatchEvent(new CustomEvent<ThemeWipeDetail>(THEME_WIPE_EVENT, { detail: { x, y, to } }));
}

/* ── 값 노이즈 ──────────────────────────────────────────────
   렌더 중 Math.random()을 못 쓰므로 모듈 로드 시 mulberry32로 격자 테이블을 한 번 굽는다.
   회전+2배 옥타브 누적 방식은 src/lib/glsl.ts의 GLSL_FBM_2D와 같게 맞췄다. */
const NOISE_SEED = 20260916;
const GRID = seededArray(256, NOISE_SEED);
const PERM = (() => {
  const rand = mulberry32(NOISE_SEED ^ 0x9e3779b9);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = p[i];
    p[i] = p[j];
    p[j] = t;
  }
  return p;
})();

function lattice(ix: number, iy: number) {
  return GRID[PERM[(PERM[ix & 255] + (iy & 255)) & 255]];
}
function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
function vnoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const a = lattice(xi, yi);
  const b = lattice(xi + 1, yi);
  const c = lattice(xi, yi + 1);
  const d = lattice(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1; // -1..1
}
function fbm2(x: number, y: number) {
  let v = 0;
  let amp = 0.5;
  let px = x;
  let py = y;
  for (let i = 0; i < 4; i++) {
    v += amp * vnoise(px, py);
    const nx = px * 1.6 + py * 1.2;
    const ny = -px * 1.2 + py * 1.6;
    px = nx;
    py = ny;
    amp *= 0.5;
  }
  return v;
}

/* cubic-bezier(0.16, 1, 0.3, 1) — 사이트 공통 이징. x로 t를 이분법으로 찾아 y를 돌려준다. */
function makeEase(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 12; i++) {
      const fx = ((ax * t + bx) * t + cx) * t;
      if (fx < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const ease = makeEase(0.16, 1, 0.3, 1);

const DURATION = 760;

type Run = ThemeWipeDetail & { id: number };

export function ThemeWipe() {
  const reduced = usePrefersReducedMotion();
  const narrow = useNarrowViewport();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seq = useRef(0);
  const [run, setRun] = useState<Run | null>(null);

  // 이벤트 구독. setState는 effect 본문이 아니라 핸들러 안에서만 부른다.
  useEffect(() => {
    if (reduced) return;
    const onWipe = (e: Event) => {
      const d = (e as CustomEvent<ThemeWipeDetail>).detail;
      if (!d) return;
      seq.current += 1;
      // 같은 id가 다시 오면 effect가 안 돌므로 항상 증가하는 id를 붙여 재시작을 보장한다.
      setRun({ x: d.x, y: d.y, to: d.to === "light" ? "light" : "dark", id: seq.current });
    };
    window.addEventListener(THEME_WIPE_EVENT, onWipe);
    return () => window.removeEventListener(THEME_WIPE_EVENT, onWipe);
  }, [reduced]);

  useEffect(() => {
    if (!run) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || reduced) {
      // 그릴 수 없거나 모션 최소화로 바뀐 경우: 다음 프레임에 그냥 걷어낸다.
      const drop = requestAnimationFrame(() => setRun(null));
      return () => cancelAnimationFrame(drop);
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.5);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // DOM은 이미 새 테마라, 덮어야 할 색은 "직전 테마"의 배경이다.
    // globals.css의 :root(--bg #071013)와 html[data-theme="light"](--bg #e9eef0) 값을 그대로 적는다.
    const oldBg = run.to === "light" ? "#071013" : "#e9eef0";
    // 앰버는 첫 프레임에서 한 번만 읽는다. effect 시점엔 data-theme이 아직 안 바뀌었을 수 있다.
    let accent = "";

    const cx = run.x;
    const cy = run.y;
    const maxR = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(w - cx, cy),
      Math.hypot(cx, h - cy),
      Math.hypot(w - cx, h - cy),
    );
    const ampBase = Math.min(w, h) * 0.07;
    const travel = maxR + ampBase * 2 + 56;
    const steps = narrow ? 96 : 168;

    // 원 위에서 노이즈를 뽑으므로 각도에 대해 자연히 주기적이다(이음매 없음).
    const edge = (radius: number, amp: number, phase: number) => {
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const th = (i / steps) * Math.PI * 2;
        const c = Math.cos(th);
        const s = Math.sin(th);
        const rr = Math.max(0, radius + fbm2(c * 2.1 + phase, s * 2.1) * amp);
        const px = cx + c * rr;
        const py = cy + s * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };

    const start = performance.now(); // 시간은 렌더가 아닌 effect 안에서 읽는다
    let raf = 0;

    const frame = (now: number) => {
      if (!accent) accent = readCssVar("--accent", "#f2b544");
      const t = Math.min(1, (now - start) / DURATION);
      const e = ease(t);
      const r = e * travel;
      // 반경이 작을 때 요철이 과하면 형태가 깨지므로 초반에는 진폭을 줄인다
      const amp = ampBase * Math.min(1, r / (ampBase * 2.2));
      const phase = 0.6 + e * 1.6; // 등고선 층이 한 칸씩 올라가듯 형태가 서서히 변한다

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = oldBg;
      ctx.fillRect(0, 0, w, h);

      // 물러나는 띠 안쪽의 얕은 등고선 몇 겹
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      for (let k = 1; k <= 3; k++) {
        ctx.globalAlpha = (0.2 - k * 0.045) * (1 - t * 0.5);
        edge(r + k * (ampBase * 0.5 + 14), amp * (1 + k * 0.12), phase + k * 0.37);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 구멍을 뚫어 아래의 새 테마를 드러낸다
      ctx.globalCompositeOperation = "destination-out";
      edge(r, amp, phase);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // 경계를 타고 흐르는 앰버 선. 끝에서 서서히 사라진다
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = Math.min(1, (1 - t) * 2.2);
      edge(r, amp, phase);
      ctx.stroke();
      ctx.globalAlpha = 1;

      if (t < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, w, h);
        setRun(null); // 캔버스를 DOM에서 제거한다
      }
    };

    // Esc를 누르면 연출을 즉시 걷어낸다(오버레이 공통 규칙)
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
      setRun(null);
    };
    window.addEventListener("keydown", onKey);

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [run, reduced, narrow]);

  if (!run) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden>
      {/* 전환 중에는 body의 0.5s 색 트랜지션을 꺼서, 드러나는 쪽이 곧바로 새 테마 색이 되게 한다 */}
      <style>{`body{transition:none !important}`}</style>
      <canvas key={run.id} ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
