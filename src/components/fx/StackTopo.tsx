"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { projects, stack } from "@/lib/content";
import { seededArray } from "@/lib/rng";
import {
  readCssVar,
  useCoarsePointer,
  useInView,
  useNarrowViewport,
  usePrefersReducedMotion,
  useTheme,
} from "@/lib/useEnv";

/* StackTopo — "다루는 것" 목록을 등고선 지도로 그린다.

   ★ 높이가 뜻하는 것(이 컴포넌트에서 제일 중요한 규칙)
   높이는 내가 매긴 숙련도가 아니다. 그건 확인할 방법이 없는 숫자다.
   높이 = content.ts의 projects[].stack에 그 기술이 적힌 "배포한 프로젝트 수"(0~5). 그것 하나뿐이다.
   등고선 간격이 0.25라서 4줄 = 프로젝트 1개로 세어진다.
   증거가 0개인 기술은 언덕을 만들지 않고 평지로 남긴다(아래 목록에는 0으로 그대로 적힌다).
   호버로 솟는 양(LIFT)은 등고선 간격보다 작다 — 솟아도 줄 수는 절대 안 바뀐다. 지도가 거짓말하면 안 되니까.

   구현 메모
   - WebGL을 새로 만들지 않는다(히어로·플레이그라운드에서 이미 2개를 쓴다). 캔버스 2D + 마칭 스퀘어.
   - 라벨은 캔버스에 그리지 않고 진짜 DOM 텍스트로 얹는다. 선택·복사·스크린리더가 전부 된다.
     (덤으로 캔버스에 한글을 그릴 때 Syne가 라틴 서브셋만 로드돼 측정이 틀어지는 함정도 피한다.) */

/* 같은 기술의 버전 표기만 다른 것을 묶는다. 여기 없는 이름은 완전히 같은 문자열로만 센다 —
   "React Router 7"이 React로 새지 않게 접두사 매칭 대신 명시적 목록을 쓴다. */
const ALIAS: Record<string, string[]> = {
  "React 19": ["React 19", "React 18"],
  "Next.js 16": ["Next.js 16", "Next.js 15"],
  "three.js / R3F": ["three.js"],
};

/* 지도 위 라벨은 버전을 뗀 이름으로 쓴다(프로젝트마다 버전이 달라서). 목록에는 원래 이름이 그대로 남는다. */
const SHORT: Record<string, string> = {
  "React 19": "React",
  "Next.js 16": "Next.js",
  "three.js / R3F": "three.js",
  "Tailwind CSS 4": "Tailwind",
};

type Tech = { name: string; label: string; count: number; where: string[] };

const TECHS: Tech[] = stack.map((name) => {
  const names = ALIAS[name] ?? [name];
  const used = projects.filter((p) => p.stack.some((s) => names.includes(s)));
  return { name, label: SHORT[name] ?? name, count: used.length, where: used.map((p) => p.title) };
});

/* sort는 안정 정렬이라 같은 개수끼리는 content.ts의 원래 순서를 지킨다(= 매번 같은 지도). */
const PEAKS = TECHS.filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
const ROWS = [...TECHS].sort((a, b) => b.count - a.count);

/* 배치는 매 로드 동일해야 한다. Math.random 대신 시드 난수만 쓴다. */
const JITTER = seededArray(Math.max(1, PEAKS.length) * 3, 0x70706f, -1, 1);

const LEVEL = 0.25; // 등고선 간격 — 4줄이 프로젝트 1개
const FIRST = 0.125; // 첫 등고선 높이
const LIFT = 0.1; // 호버 시 솟는 양. LEVEL보다 작아야 등고선 줄 수가 안 바뀐다
const STEP = 5; // 높이맵 격자 간격(CSS px)
const LEGEND = "높이 = 이 기술을 쓴 배포 프로젝트 수";

type Slot = { x: number; y: number; r: number };

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

/** 봉우리를 흔든 격자에 앉힌다. x·y는 0~1 비율, r은 px. 폭에 따라 열 수만 바뀐다. */
function layout(w: number, h: number): Slot[] {
  const n = PEAKS.length;
  if (!n || w < 2 || h < 2) return [];
  const cols = Math.min(n, w < 500 ? 2 : w < 680 ? 3 : 4);
  const rows = Math.ceil(n / cols);
  const unit = Math.sqrt((w / cols) * (h / rows));
  return PEAKS.map((p, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const col = (i % cols) + (cols - inRow) / 2; // 마지막 줄이 비면 가운데로 모은다
    const x = clamp((col + 0.5 + JITTER[i * 3] * 0.16) / cols, 0.08, 0.92);
    const y = clamp((row + 0.5 + JITTER[i * 3 + 1] * 0.14) / rows, 0.14, 0.86);
    const r = unit * (0.44 + 0.055 * p.count) * (0.94 + 0.1 * JITTER[i * 3 + 2]);
    return { x, y, r };
  });
}

type Hill = { cx: number; cy: number; r: number; amp: number; crown: number };

export function StackTopo() {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverRef = useRef(-1);

  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const narrow = useNarrowViewport();
  const theme = useTheme();
  const inView = useInView(boxRef, "200px");
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(-1);

  const live = !reduced && !coarse; // 호버로 솟는 연출을 켤지
  const slots = useMemo(() => layout(size.w, size.h), [size.w, size.h]);

  // 컨테이너 크기 측정. ResizeObserver 콜백은 effect 본문이 아니라 비동기 콜백이라 setState가 허용된다.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      const h = Math.round(e.contentRect.height);
      setSize((s) => (s.w === w && s.h === h ? s : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    const box = boxRef.current;
    const { w, h } = size;
    if (!cv || !box || narrow || !inView || w < 2 || h < 2 || !slots.length) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);

    const hills: Hill[] = slots.map((s, i) => ({
      cx: s.x * w,
      cy: s.y * h,
      r: s.r,
      amp: PEAKS[i].count,
      crown: PEAKS[i].count * 4 - 1, // 그 봉우리의 맨 위 등고선 인덱스(높이 count - 0.125)
    }));
    const gx = Math.floor(w / STEP) + 2;
    const gy = Math.floor(h / STEP) + 2;
    const field = new Float32Array(gx * gy);
    const owner = new Uint8Array(gx * gy); // 그 격자를 차지한 봉우리 번호(NONE이면 평지)
    const lift = new Float32Array(hills.length);
    const NONE = 255;

    /* 높이맵 = 봉우리마다 얹은 포물면 혹. 합이 아니라 max로 합성한다.
       더해 버리면 큰 봉우리 옆의 작은 봉우리가 덩달아 높아져서 등고선 줄 수가 프로젝트 수와 달라진다.
       그건 지도가 거짓말을 하는 것이라 안 된다. max면 각 봉우리 정상은 정확히 amp(=프로젝트 수)이고
       줄 수도 정확히 4 × 프로젝트 수다. 겹치는 자리는 능선처럼 이어 붙는다. */
    const buildField = () => {
      field.fill(0);
      owner.fill(NONE);
      for (let p = 0; p < hills.length; p++) {
        const { cx, cy, r } = hills[p];
        const amp = hills[p].amp + lift[p] * LIFT;
        const r2 = r * r;
        const i0 = Math.max(0, Math.floor((cx - r) / STEP));
        const i1 = Math.min(gx - 1, Math.ceil((cx + r) / STEP));
        const j0 = Math.max(0, Math.floor((cy - r) / STEP));
        const j1 = Math.min(gy - 1, Math.ceil((cy + r) / STEP));
        for (let j = j0; j <= j1; j++) {
          const dy = j * STEP - cy;
          const dy2 = dy * dy;
          const row = j * gx;
          for (let i = i0; i <= i1; i++) {
            const dx = i * STEP - cx;
            const q = (dx * dx + dy2) / r2;
            if (q >= 1) continue;
            const v = amp * (1 - q); // 포물면 — 제곱근도 거듭제곱도 없다
            if (v <= field[row + i]) continue;
            field[row + i] = v;
            owner[row + i] = p;
          }
        }
      }
    };

    const draw = () => {
      buildField();
      const hi = hoverRef.current;
      const hov = hi >= 0 ? hills[hi] : null;

      const base = new Path2D(); // 보통 등고선
      const upper = new Path2D(); // 위쪽 절반 — 한 번 더 그어 고도감을 준다
      const crown = new Path2D(); // 각 봉우리의 맨 위 등고선
      const hot = new Path2D(); // 호버된 봉우리
      let up = false;
      let isHot = false;
      let isCrown = false;

      const emit = (ax: number, ay: number, bx2: number, by2: number) => {
        base.moveTo(ax, ay);
        base.lineTo(bx2, by2);
        if (up) {
          upper.moveTo(ax, ay);
          upper.lineTo(bx2, by2);
        }
        if (isHot) {
          hot.moveTo(ax, ay);
          hot.lineTo(bx2, by2);
        }
        if (isCrown) {
          crown.moveTo(ax, ay);
          crown.lineTo(bx2, by2);
        }
      };

      // 마칭 스퀘어: 격자 한 칸의 네 꼭짓점 높이를 보고, 그 칸을 지나는 레벨만 골라 선분을 만든다.
      for (let j = 0; j < gy - 1; j++) {
        const r0 = j * gx;
        const r1 = r0 + gx;
        const y0 = j * STEP;
        const y1 = y0 + STEP;
        for (let i = 0; i < gx - 1; i++) {
          const a = field[r0 + i];
          const b = field[r0 + i + 1];
          const c = field[r1 + i + 1];
          const d = field[r1 + i];
          let mn = a;
          let mx = a;
          if (b < mn) mn = b;
          if (b > mx) mx = b;
          if (c < mn) mn = c;
          if (c > mx) mx = c;
          if (d < mn) mn = d;
          if (d > mx) mx = d;
          if (mx <= FIRST) continue;

          const k0 = Math.max(0, Math.ceil((mn - FIRST) / LEVEL));
          const k1 = Math.floor((mx - FIRST - 1e-6) / LEVEL);
          if (k1 < k0) continue;

          const x0 = i * STEP;
          const x1 = x0 + STEP;
          /* 이 칸을 차지한 봉우리로 강조를 가른다. max 합성이라 소유자가 딱 정해지고,
             옆 봉우리 비탈이 우연히 같은 높이를 지나도 남의 정상선으로 오인되지 않는다. */
          const own = owner[r0 + i];
          const crownK = own === NONE ? -1 : hills[own].crown;
          isHot = own === hi;

          for (let k = k0; k <= k1; k++) {
            const L = FIRST + k * LEVEL;
            const m = (a > L ? 1 : 0) | (b > L ? 2 : 0) | (c > L ? 4 : 0) | (d > L ? 8 : 0);
            if (m === 0 || m === 15) continue;

            up = L > mx * 0.55; // 봉우리 위쪽 절반은 한 번 더 그어 고도감을 준다
            isCrown = k === crownK;

            const tx = x0 + STEP * (b === a ? 0.5 : (L - a) / (b - a)); // 위 변
            const ry = y0 + STEP * (c === b ? 0.5 : (L - b) / (c - b)); // 오른 변
            const bx = x0 + STEP * (c === d ? 0.5 : (L - d) / (c - d)); // 아래 변
            const ly = y0 + STEP * (d === a ? 0.5 : (L - a) / (d - a)); // 왼 변

            switch (m) {
              case 1:
              case 14:
                emit(x0, ly, tx, y0);
                break;
              case 2:
              case 13:
                emit(tx, y0, x1, ry);
                break;
              case 3:
              case 12:
                emit(x0, ly, x1, ry);
                break;
              case 4:
              case 11:
                emit(x1, ry, bx, y1);
                break;
              case 6:
              case 9:
                emit(tx, y0, bx, y1);
                break;
              case 7:
              case 8:
                emit(x0, ly, bx, y1);
                break;
              case 5: // 안장점
                emit(x0, ly, tx, y0);
                emit(x1, ry, bx, y1);
                break;
              default: // 10, 안장점
                emit(tx, y0, x1, ry);
                emit(x0, ly, bx, y1);
                break;
            }
          }
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = readCssVar("--line", "rgba(230, 237, 235, 0.14)");
      ctx.stroke(base);
      ctx.stroke(upper);
      if (hov) {
        ctx.globalAlpha = 0.3 * lift[hi];
        ctx.strokeStyle = readCssVar("--fg", "#e6edeb");
        ctx.stroke(hot);
        ctx.globalAlpha = 1;
      }
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = readCssVar("--accent", "#f2b544");
      ctx.stroke(crown);
    };

    let raf = 0;
    let running = false;
    const tick = () => {
      let moving = false;
      for (let i = 0; i < lift.length; i++) {
        const target = i === hoverRef.current ? 1 : 0;
        const next = lift[i] + (target - lift[i]) * 0.16;
        if (Math.abs(target - next) < 0.004) {
          lift[i] = target;
        } else {
          lift[i] = next;
          moving = true;
        }
      }
      draw();
      if (moving) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
        running = false;
      }
    };
    const wake = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    draw(); // 정지 상태 한 장. 모션 최소화·터치면 여기서 끝이고 rAF는 돌지 않는다.

    if (!live) {
      hoverRef.current = -1;
      return;
    }

    const pick = (e: PointerEvent) => {
      const rect = box.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      let found = -1;
      let best = Infinity;
      for (let i = 0; i < hills.length; i++) {
        const dx = px - hills[i].cx;
        const dy = py - hills[i].cy;
        const nd = Math.sqrt(dx * dx + dy * dy) / hills[i].r; // 반경으로 정규화 — 큰 봉우리가 넓게 잡힌다
        if (nd < 0.8 && nd < best) {
          best = nd;
          found = i;
        }
      }
      if (found === hoverRef.current) return;
      hoverRef.current = found;
      setHover(found);
      wake();
    };
    const leave = () => {
      if (hoverRef.current === -1) return;
      hoverRef.current = -1;
      setHover(-1);
      wake();
    };

    box.addEventListener("pointermove", pick, { passive: true });
    box.addEventListener("pointerleave", leave, { passive: true });
    return () => {
      box.removeEventListener("pointermove", pick);
      box.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [narrow, inView, size, slots, theme, live]);

  return (
    <div>
      {/* 좁은 화면에서는 CSS로 지도를 아예 숨긴다(하이드레이션 전에도). 아래 평문 목록만 남는다. */}
      <div className="hidden md:block">
        <div
          ref={boxRef}
          className="relative h-[24rem] w-full overflow-hidden rounded-2xl border border-line bg-card/40 md:h-[26rem] lg:h-[28rem] xl:h-[30rem]"
        >
          {!narrow ? <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" /> : null}

          <ul
            aria-label="기술별 봉우리. 높이는 그 기술을 쓴 배포 프로젝트 수"
            className="absolute inset-0 m-0 list-none p-0"
          >
            {slots.map((s, i) => {
              const p = PEAKS[i];
              const on = live && hover === i;
              return (
                <li
                  key={p.name}
                  className="absolute w-32"
                  style={{
                    left: `${(s.x * 100).toFixed(3)}%`,
                    top: `${(s.y * 100).toFixed(3)}%`,
                    // 라벨을 봉우리 정상 바로 위에 올린다. 정상 등고선(accent)이 글자에 가리지 않는다.
                    transform: `translate(-50%, ${on ? "calc(-128% - 4px)" : "-128%"})`,
                    transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <span
                    className={`block text-center text-[0.8rem] font-medium leading-tight ${on ? "text-accent" : "text-fg"}`}
                  >
                    {p.label}
                  </span>
                  <span className="block text-center text-[0.7rem] leading-tight tabular-nums text-muted">
                    {p.count}개 프로젝트
                  </span>
                  {/* 근거가 되는 프로젝트 이름. 호버에서만 뜨지만 같은 값이 아래 목록에 늘 보인다. */}
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-full block w-40 -translate-x-1/2 pt-1 text-center text-[0.62rem] leading-snug text-muted"
                    style={{ opacity: on ? 1 : 0, transition: "opacity 0.25s ease" }}
                  >
                    {p.where.join(" · ")}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* 지도 안 범례 — 높이가 무엇인지 지도에서 바로 읽히게. 같은 문장이 아래 목록 위에도 있다. */}
          <p aria-hidden className="absolute bottom-3 left-4 text-[0.68rem] leading-snug text-muted">
            <span className="text-accent">▲</span> {LEGEND} · 등고선 4줄 = 프로젝트 1개
          </p>
        </div>
      </div>

      {/* 캔버스가 없어도(모바일·오류·스크린리더) 같은 정보가 그대로 남는 평문 목록 */}
      <p className="mt-6 text-xs leading-relaxed text-muted md:mt-5">
        {LEGEND}. 숙련도 자기평가가 아니라 배포한 프로젝트 5개의 stack 기록을 그대로 센 값입니다.
      </p>
      <ul className="mt-3 border-t border-line">
        {ROWS.map((t) => (
          <li key={t.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line py-2.5">
            <span className="font-display text-base font-semibold md:text-lg">{t.name}</span>
            <span className="text-xs tabular-nums text-accent">{t.count}개 프로젝트</span>
            <span className="text-xs text-muted">
              {t.where.length ? t.where.join(" · ") : "배포 프로젝트 stack 기록 없음 — 평지"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
