"use client";

import { useEffect, useRef } from "react";
import { mulberry32 } from "@/lib/rng";
import {
  useCoarsePointer,
  useInView,
  useNarrowViewport,
  usePrefersReducedMotion,
  useTheme,
} from "@/lib/useEnv";

/* 필름 그레인 + 비네트.
   등고선 배경·스크린샷·타이포를 한 장의 필름처럼 묶는 분위기 레이어.
   커서(z-60)와 커맨드 팔레트보다 아래, 본문보다 위인 z-45에 pointer-events-none으로 떠 있어
   클릭을 절대 가로채지 않는다.

   비용을 낮추는 두 가지 선택:
   1) 128px 타일 하나만 새로 찍고 패턴으로 화면을 한 번에 채운다(매 프레임 아님, 초당 16번).
   2) 백버퍼를 뷰포트의 55%로만 잡는다. DPR을 일부러 무시한다 — 그레인은 선명할 필요가 없고,
      살짝 확대되면서 입자가 굵어져 오히려 필름에 가깝다. */

const TILE = 128; // 노이즈 타일 한 변(px)
const RES = 0.55; // 백버퍼 해상도 배율
const MAX_W = 1400; // 4K에서도 백버퍼가 커지지 않게 상한
const FRAME_MS = 1000 / 16; // 그레인 재생성 주기(약 16fps)
const V_FULL = 2600; // 이 스크롤 속도(px/s)에서 커플링이 최대
const DENSITY = 0.34; // 기본 입자 밀도(0~1)

type Look = {
  base: number; // 정지 상태 레이어 불투명도
  peak: number; // 최대 속도에서의 불투명도
  white: number; // 밝은 입자 비율(나머지는 어두운 입자)
  vigMid: number; // 비네트 중간 정거장 알파
  vigOut: number; // 비네트 가장자리 알파
  blend: "screen" | "multiply"; // RGB 분리를 어떻게 얹을지
};

/* 다크는 밝은 입자가 많아야 필름처럼 보이고, 라이트는 어두운 입자가 많아야 읽힌다.
   라이트에서 같은 불투명도를 쓰면 화면이 뿌옇게 뜨므로 절반 가까이 낮춘다. */
const LOOK: Record<"dark" | "light", Look> = {
  dark: { base: 0.042, peak: 0.068, white: 0.62, vigMid: 0.16, vigOut: 0.55, blend: "screen" },
  light: { base: 0.026, peak: 0.044, white: 0.34, vigMid: 0.09, vigOut: 0.32, blend: "multiply" },
};

/* RGB 분리는 색 자체가 효과라서 토큰 대신 리터럴을 쓴다(셰이더 안의 색과 같은 취급). */
const EDGE_R =
  "linear-gradient(90deg, rgba(255,70,70,0.7), rgba(255,70,70,0) 2.5%), linear-gradient(180deg, rgba(255,70,70,0.7), rgba(255,70,70,0) 1.8%)";
const EDGE_C =
  "linear-gradient(270deg, rgba(70,225,255,0.7), rgba(70,225,255,0) 2.5%), linear-gradient(0deg, rgba(70,225,255,0.7), rgba(70,225,255,0) 1.8%)";

/** 타일 한 장을 새로 찍는다. density는 입자가 찍히는 비율, white는 밝은 입자 비율. */
function paintTile(
  tctx: CanvasRenderingContext2D,
  img: ImageData,
  rand: () => number,
  density: number,
  white: number,
) {
  const d = img.data;
  d.fill(0); // 이전 프레임 지우기. memset이라 픽셀마다 0을 쓰는 것보다 훨씬 싸다.
  const n = TILE * TILE;
  for (let i = 0; i < n; i++) {
    if (rand() > density) continue;
    const o = i * 4;
    const v = rand() < white ? 255 : 0; // 밝은 입자와 어두운 입자를 섞어야 두 테마에서 모두 읽힌다
    d[o] = v;
    d[o + 1] = v;
    d[o + 2] = v;
    d[o + 3] = 96 + rand() * 159; // 입자마다 농도를 달리해 뭉침을 만든다
  }
  tctx.putImageData(img, 0, 0);
}

type FilmGrainProps = {
  /** 그레인 농도 배율(0~2). 0이면 그레인 없음. 기본 1 */
  intensity?: number;
  /** 비네트 세기 배율(0~2). 0이면 비네트 없음. 기본 1 */
  vignette?: number;
};

export function FilmGrain({ intensity = 1, vignette = 1 }: FilmGrainProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const narrow = useNarrowViewport();
  const theme = useTheme();
  const inView = useInView(rootRef, "0px");

  // 모션 최소화·터치·좁은 화면이면 재생성 루프와 RGB 분리를 끄고 정지 그레인만 남긴다.
  const live = !reduced && !coarse && !narrow;
  const look = LOOK[theme];
  const base = Math.max(0, look.base * intensity);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const tile = document.createElement("canvas");
    tile.width = TILE;
    tile.height = TILE;
    const tctx = tile.getContext("2d");
    if (!tctx) return;
    const img = tctx.createImageData(TILE, TILE);
    const rand = mulberry32(0x9e3779b1); // 결정적 시드 — Math.random을 쓰지 않는다

    let w = 0;
    let h = 0;

    /** 뷰포트를 한 번 읽어 백버퍼를 맞춘다. 크기가 바뀌었으면 true. */
    const fit = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const res = Math.min(RES, MAX_W / Math.max(vw, 1));
      const nw = Math.max(1, Math.round(vw * res));
      const nh = Math.max(1, Math.round(vh * res));
      if (nw === w && nh === h) return false;
      w = nw;
      h = nh;
      cv.width = w;
      cv.height = h;
      return true;
    };

    /** 타일을 새로 찍고 패턴으로 화면을 덮는다. 레이아웃 읽기 없음, 쓰기 한 번. */
    const draw = (energy: number) => {
      paintTile(tctx, img, rand, DENSITY + energy * 0.22, look.white);
      const pat = ctx.createPattern(tile, "repeat"); // 패턴은 만든 시점의 타일을 복사하므로 매번 다시 만든다
      if (!pat) return;
      const s = 1 + energy * 0.5; // 빠를수록 입자가 굵어진다
      const ox = -rand() * TILE * s; // 타일 이음매가 고정돼 보이지 않게 매번 어긋나게 깐다
      const oy = -rand() * TILE * s;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.setTransform(s, 0, 0, s, ox, oy);
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, (w - ox) / s + TILE, (h - oy) / s + TILE);
    };

    fit();
    draw(0);

    // 리사이즈는 rAF 하나로 묶는다. 백버퍼를 다시 잡으면 내용이 지워지므로 그때만 다시 그린다.
    let fitRaf = 0;
    const onResize = () => {
      if (fitRaf) return;
      fitRaf = requestAnimationFrame(() => {
        fitRaf = 0;
        if (fit()) draw(0);
      });
    };
    window.addEventListener("resize", onResize, { passive: true });

    const stopResize = () => {
      window.removeEventListener("resize", onResize);
      if (fitRaf) cancelAnimationFrame(fitRaf);
    };

    // 정지 모드: 루프 없이 한 장만 남긴다. 화면 밖(또는 display:none)일 때도 여기서 끝난다.
    if (!live || !inView) return stopResize;

    const split = splitRef.current;
    const peak = Math.max(0, look.peak * intensity);
    let raf = 0;
    let last = 0;
    let lastY = window.scrollY;
    let acc = 0;
    let energy = 0;
    let shown = -1;

    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      const dt = last ? Math.min(100, t - last) : 16; // 탭 복귀 시 dt 폭주 방지
      last = t;

      // 레이아웃 읽기는 이 한 줄뿐: 스크롤 위치 → 속도(px/s)
      const y = window.scrollY;
      const v = (Math.abs(y - lastY) / dt) * 1000;
      lastY = y;

      const target = Math.min(1, v / V_FULL);
      // 빨라질 땐 금방(반감기 70ms), 멈추면 천천히(반감기 260ms면 1.5초 뒤 약 2%까지 내려온다)
      const half = target > energy ? 70 : 260;
      energy += (target - energy) * (1 - Math.pow(0.5, dt / half));

      acc += dt;
      if (acc >= FRAME_MS) {
        acc = 0;
        draw(energy);
      }

      if (Math.abs(energy - shown) > 0.002) {
        shown = energy;
        cv.style.opacity = (base + (peak - base) * energy).toFixed(4);
        // 제곱을 씌워 어지간히 빠를 때만 색 분리가 올라오게 한다
        if (split) split.style.opacity = (energy * energy * 0.4).toFixed(3);
      }
    };
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      stopResize();
    };
  }, [live, inView, look, intensity, base]);

  // 비네트는 --bg로 칠한다: 다크에서는 모서리가 어두워지고 라이트에서는 밝아진다. 테마 전환은 CSS가 알아서 한다.
  const vigMid = Math.min(100, Math.max(0, look.vigMid * vignette * 100)).toFixed(1);
  const vigOut = Math.min(100, Math.max(0, look.vigOut * vignette * 100)).toFixed(1);
  const vignetteCss =
    `radial-gradient(125% 95% at 50% 42%, transparent 32%,` +
    ` color-mix(in srgb, var(--bg) ${vigMid}%, transparent) 70%,` +
    ` color-mix(in srgb, var(--bg) ${vigOut}%, transparent) 100%)`;

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none fixed inset-0 z-[45]">
      <div className="absolute inset-0" style={{ background: vignetteCss }} />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ opacity: base, willChange: "opacity" }}
      />
      {live ? (
        <div
          ref={splitRef}
          className="absolute inset-0"
          style={{ opacity: 0, mixBlendMode: look.blend, willChange: "opacity" }}
        >
          {/* 좌·상은 붉게, 우·하는 청록으로 1px씩 어긋나 가장자리에 색 분리가 생긴다 */}
          <span
            className="absolute -inset-x-1 inset-y-0 block"
            style={{ transform: "translateX(-1px)", backgroundImage: EDGE_R }}
          />
          <span
            className="absolute -inset-x-1 inset-y-0 block"
            style={{ transform: "translateX(1px)", backgroundImage: EDGE_C }}
          />
        </div>
      ) : null}
    </div>
  );
}
