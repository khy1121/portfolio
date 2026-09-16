"use client";

import { createElement, useEffect, useRef, useState } from "react";
import {
  useCoarsePointer,
  useCssVar,
  useInView,
  usePrefersReducedMotion,
  useTheme,
} from "@/lib/useEnv";

/* TopoType — 제목을 채워진 글자가 아니라 "그 글자 모양의 등고선 지도"로 그린다.
   히어로 셰이더(TerrainField)와 같은 문법: 얇은 1px 등고선 + 한 줄만 앰버.

   WebGL 컨텍스트는 히어로와 플레이그라운드가 이미 쓰고 있어 여기는 캔버스 2D만 쓴다.
   파이프라인:
     1) 요소의 "진짜" computed font로 오프스크린 캔버스에 글자를 래스터라이즈.
        Syne는 라틴 서브셋만 로드돼 한글은 Pretendard로 떨어진다. 폰트 문자열을 하드코딩하면
        폭·글리프가 전부 틀어지므로 반드시 getComputedStyle에서 읽는다.
     2) 알파 채널을 박스 블러 3패스로 뭉개 높이장(height field)을 만들고 최대값으로 정규화.
     3) 마칭 스퀘어로 N개 등치선을 뽑아 CSS px 폴리라인으로 캐시.
     4) 매 프레임은 캐시된 폴리라인을 스트로크만 한다. 지오메트리 계산은 리사이즈 때만.

   접근성: h2에 aria-label로 진짜 문자열이 붙고, 안쪽 span에도 실제 텍스트가 남아 복사된다.
   캔버스를 못 만들면 그 span이 그대로 보이므로 정보가 사라지는 경우는 없다.
   레이아웃: 캔버스는 span 안에 absolute로 떠 있어 박스 크기에 전혀 영향을 주지 않는다. */

const PAD_K = 0.3; // 글자 박스 바깥으로 등고선이 번지는 여백(폰트 크기 대비)
const BLUR_K = 0.075; // 높이장 블러 반경(폰트 크기 대비). 크면 뭉개지고 작으면 윤곽선처럼 보인다
const FIELD_MAX_W = 340; // 높이장 최대 해상도(셀). 마칭 스퀘어 비용이 여기서 결정된다
const FIELD_MAX_H = 180;
const STEP_CSS = 2.4; // 폴리라인 점 간격(CSS px)
const DEFAULT_LEVELS = 12;
const INTRO_MS = 1100; // 바깥에서 안쪽으로 그려지는 시간
const BUMP_R = 180; // 마우스 융기 반경(CSS px)
const BUMP_MAX = 17; // 융기 정점에서 선이 밀리는 최대 거리(CSS px)

/* ── 색 ─────────────────────────────────────────────────────────────── */

type RGBA = { r: number; g: number; b: number; a: number };

const FG_FB: RGBA = { r: 230, g: 237, b: 235, a: 1 };
const LINE_FB: RGBA = { r: 230, g: 237, b: 235, a: 0.14 };
const AC_FB: RGBA = { r: 242, g: 181, b: 68, a: 1 };

/** CSS 변수 문자열(#rgb, #rrggbb, rgb(), rgba())을 성분으로 쪼갠다. 실패하면 폴백. */
function parseColor(raw: string, fb: RGBA): RGBA {
  const v = raw.trim();
  if (v.startsWith("#")) {
    const hex = v.slice(1);
    const n = hex.length;
    let r = NaN;
    let g = NaN;
    let b = NaN;
    let a = 1;
    if (n === 3 || n === 4) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
      if (n === 4) a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (n === 6 || n === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      if (n === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
    }
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) return { r, g, b, a };
    return fb;
  }
  const m = v.match(/-?\d*\.?\d+/g);
  if (m && m.length >= 3) {
    const r = +m[0];
    const g = +m[1];
    const b = +m[2];
    const a = m.length > 3 ? +m[3] : 1;
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) && Number.isFinite(a)) {
      return { r, g, b, a };
    }
  }
  return fb;
}

/* ── 이징: 사이트 공통 cubic-bezier(0.16, 1, 0.3, 1) ─────────────────── */

function bezier(c1: number, c2: number, t: number) {
  const u = 1 - t;
  return 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t;
}

/** x를 이분법으로 풀고 y를 돌려준다. 12회면 오차가 눈에 보이지 않는다. */
function ease(p: number) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  let lo = 0;
  let hi = 1;
  let t = p;
  for (let i = 0; i < 12; i++) {
    if (bezier(0.16, 0.3, t) < p) lo = t;
    else hi = t;
    t = (lo + hi) * 0.5;
  }
  return bezier(1, 1, t);
}

/* 인트로 진행도. 공통 이징을 그대로 쓰면 1100ms짜리가 300ms 만에 끝나 버린다.
   선형과 섞어 "펜이 일정한 속도로 지나가고 끝에서만 감속하는" 느낌으로 맞춘다. */
function introEase(p: number) {
  return 0.42 * p + 0.58 * ease(p);
}

/* ── 높이장 ──────────────────────────────────────────────────────────── */

/** 가로 박스 블러(누적합). 3번 반복하면 가우시안에 가까워진다. */
function blurH(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const inv = 1 / (r * 2 + 1);
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += src[o + Math.min(w - 1, Math.max(0, i))];
    for (let x = 0; x < w; x++) {
      dst[o + x] = sum * inv;
      sum += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
    }
  }
}

/** 세로 박스 블러. */
function blurV(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const inv = 1 / (r * 2 + 1);
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let i = -r; i <= r; i++) sum += src[Math.min(h - 1, Math.max(0, i)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = sum * inv;
      sum += src[Math.min(h - 1, y + r + 1) * w + x] - src[Math.max(0, y - r) * w + x];
    }
  }
}

/* ── 마칭 스퀘어 ─────────────────────────────────────────────────────── */

type Ring = { pts: Float32Array; closed: boolean; len: number };

/* 격자 에지에 고유 번호를 준다. 가로 에지 H(x,y)=2*(y*W+x), 세로 에지 V(x,y)=2*(y*W+x)+1.
   같은 에지를 공유하는 이웃 셀이 똑같은 교차점을 재사용하므로 체인 잇기가 정확해진다. */
type Scratch = {
  ex: Float32Array;
  ey: Float32Array;
  l0: Int32Array;
  l1: Int32Array;
  mark: Uint8Array;
  seen: Uint8Array;
  /** 이번 레벨에서 교차점이 생긴 에지 번호. 전체 격자를 훑지 않으려고 모아 둔다. */
  ids: Int32Array;
};

function makeScratch(w: number, h: number): Scratch {
  const n = w * h * 2;
  const l0 = new Int32Array(n).fill(-1);
  const l1 = new Int32Array(n).fill(-1);
  return {
    ex: new Float32Array(n),
    ey: new Float32Array(n),
    l0,
    l1,
    mark: new Uint8Array(n),
    seen: new Uint8Array(n),
    ids: new Int32Array(n),
  };
}

/** 높이장 f에서 thr 등치선을 추출한다. 좌표는 kx/ky를 곱해 CSS px로 내보낸다. */
function trace(
  f: Float32Array,
  W: number,
  H: number,
  thr: number,
  minStep: number,
  kx: number,
  ky: number,
  s: Scratch,
): Ring[] {
  const { ex, ey, l0, l1, mark, seen, ids } = s;
  let ic = 0; // 교차점이 생긴 에지 개수

  const link = (p: number, q: number) => {
    if (l0[p] < 0) l0[p] = q;
    else if (l1[p] < 0) l1[p] = q;
    if (l0[q] < 0) l0[q] = p;
    else if (l1[q] < 0) l1[q] = p;
  };

  for (let y = 0; y < H - 1; y++) {
    const r0 = y * W;
    const r1 = r0 + W;
    for (let x = 0; x < W - 1; x++) {
      const va = f[r0 + x];
      const vb = f[r0 + x + 1];
      const vc = f[r1 + x + 1];
      const vd = f[r1 + x];
      const ia = va > thr;
      const ib = vb > thr;
      const ic2 = vc > thr;
      const id = vd > thr;
      const st = (ia ? 1 : 0) | (ib ? 2 : 0) | (ic2 ? 4 : 0) | (id ? 8 : 0);
      if (st === 0 || st === 15) continue;

      const eT = (r0 + x) * 2;
      const eB = (r1 + x) * 2;
      const eL = (r0 + x) * 2 + 1;
      const eR = (r0 + x + 1) * 2 + 1;

      if (ia !== ib && !mark[eT]) {
        mark[eT] = 1;
        ids[ic++] = eT;
        ex[eT] = x + (thr - va) / (vb - va);
        ey[eT] = y;
      }
      if (id !== ic2 && !mark[eB]) {
        mark[eB] = 1;
        ids[ic++] = eB;
        ex[eB] = x + (thr - vd) / (vc - vd);
        ey[eB] = y + 1;
      }
      if (ia !== id && !mark[eL]) {
        mark[eL] = 1;
        ids[ic++] = eL;
        ex[eL] = x;
        ey[eL] = y + (thr - va) / (vd - va);
      }
      if (ib !== ic2 && !mark[eR]) {
        mark[eR] = 1;
        ids[ic++] = eR;
        ex[eR] = x + 1;
        ey[eR] = y + (thr - vb) / (vc - vb);
      }

      switch (st) {
        case 1:
        case 14:
          link(eL, eT);
          break;
        case 2:
        case 13:
          link(eT, eR);
          break;
        case 3:
        case 12:
          link(eL, eR);
          break;
        case 4:
        case 11:
          link(eR, eB);
          break;
        case 6:
        case 9:
          link(eT, eB);
          break;
        case 7:
        case 8:
          link(eL, eB);
          break;
        default: {
          // 5, 10은 안장점. 셀 중앙값으로 어느 쪽이 이어지는지 정한다.
          const ctr = (va + vb + vc + vd) * 0.25 > thr;
          if ((st === 5) === ctr) {
            link(eT, eR);
            link(eB, eL);
          } else {
            link(eL, eT);
            link(eR, eB);
          }
          break;
        }
      }
    }
  }

  const out: Ring[] = [];
  const total = W * H * 2;
  const minStep2 = minStep * minStep;
  const px: number[] = [];
  const py: number[] = [];

  const walk = (start: number) => {
    px.length = 0;
    py.length = 0;
    let cur = start;
    let last = start;
    let lx = 0;
    let ly = 0;
    let count = 0;
    while (cur >= 0 && !seen[cur]) {
      seen[cur] = 1;
      const cx = ex[cur];
      const cy = ey[cur];
      // 점을 솎아 낸다. 블러된 장이라 이 정도로 줄여도 곡선이 매끄럽다.
      const dx = cx - lx;
      const dy = cy - ly;
      if (count === 0 || dx * dx + dy * dy >= minStep2) {
        px.push(cx);
        py.push(cy);
        lx = cx;
        ly = cy;
        count++;
      }
      last = cur;
      const a0 = l0[cur];
      const a1 = l1[cur];
      cur = a0 >= 0 && !seen[a0] ? a0 : a1 >= 0 && !seen[a1] ? a1 : -1;
    }
    const closed = count > 3 && (l0[last] === start || l1[last] === start);
    if (!closed && count > 0) {
      // 격자 경계에서 끊긴 선은 마지막 점을 반드시 포함시킨다
      const fx = ex[last];
      const fy = ey[last];
      if (px[count - 1] !== fx || py[count - 1] !== fy) {
        px.push(fx);
        py.push(fy);
        count++;
      }
    }
    if (count < 4) return;

    let minx = Infinity;
    let maxx = -Infinity;
    let miny = Infinity;
    let maxy = -Infinity;
    for (let i = 0; i < count; i++) {
      if (px[i] < minx) minx = px[i];
      if (px[i] > maxx) maxx = px[i];
      if (py[i] < miny) miny = py[i];
      if (py[i] > maxy) maxy = py[i];
    }
    // 블러 잡음에서 나온 좁쌀 고리는 버린다
    if (maxx - minx < minStep * 1.5 && maxy - miny < minStep * 1.5) return;

    const pts = new Float32Array(count * 2);
    let len = 0;
    for (let i = 0; i < count; i++) {
      pts[i * 2] = px[i] * kx;
      pts[i * 2 + 1] = py[i] * ky;
      if (i > 0) len += Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
    }
    if (closed) len += Math.hypot(pts[0] - pts[count * 2 - 2], pts[1] - pts[count * 2 - 1]);
    out.push({ pts, closed, len });
  };

  // 먼저 열린 체인(이웃이 하나뿐인 끝점)부터, 남은 것은 닫힌 고리로 처리한다
  for (let i = 0; i < total; i++) if (mark[i] && !seen[i] && l1[i] < 0) walk(i);
  for (let i = 0; i < total; i++) if (mark[i] && !seen[i]) walk(i);
  return out;
}

/* ── 지오메트리 ──────────────────────────────────────────────────────── */

type Measure = {
  key: string;
  font: string;
  ls: string;
  size: number;
  pad: number;
  w: number;
  h: number;
  boxH: number;
};

type Geo = { key: string; pad: number; w: number; h: number; rings: Ring[][] };

/** 요소의 실제 박스와 computed font를 읽는다. 여기서 읽은 값이 캐시 키가 된다. */
function measure(el: HTMLElement, text: string, levels: number): Measure | null {
  const rect = el.getBoundingClientRect();
  if (rect.width < 4 || rect.height < 4) return null;
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize) || 16;
  // font 단축 속성을 빈 문자열로 주는 브라우저가 있어 개별 속성으로 조립해 둔다.
  const short = cs.font.trim();
  const font = short || `${cs.fontStyle} ${cs.fontWeight} ${size}px/${cs.lineHeight} ${cs.fontFamily}`;
  const ls = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  const pad = Math.round(size * PAD_K);
  const boxH = Math.round(rect.height);
  const w = Math.round(rect.width) + pad * 2;
  const h = boxH + pad * 2;
  return { key: `${w}x${h}|${font}|${ls}|${levels}|${text}`, font, ls, size, pad, w, h, boxH };
}

/** 글자 → 높이장 → 등고선. 리사이즈·폰트 로드 때만 돌아간다(수 ms). */
function build(text: string, levels: number, m: Measure): Geo | null {
  const fit = Math.min(1, FIELD_MAX_W / m.w, FIELD_MAX_H / m.h);
  const fw = Math.max(8, Math.round(m.w * fit));
  const fh = Math.max(8, Math.round(m.h * fit));

  const rc = document.createElement("canvas");
  rc.width = fw;
  rc.height = fh;
  const rx = rc.getContext("2d", { willReadFrequently: true });
  if (!rx) return null;

  rx.setTransform(fw / m.w, 0, 0, fh / m.h, 0, 0);
  rx.font = m.font;
  // letterSpacing은 비교적 최근 API다. 없으면 자간 없이 그려지고 여백 안에서 흡수된다.
  rx.letterSpacing = m.ls;
  rx.textAlign = "left";
  rx.textBaseline = "alphabetic";
  rx.fillStyle = "#fff";

  const tm = rx.measureText(text);
  const asc = Number.isFinite(tm.fontBoundingBoxAscent) ? tm.fontBoundingBoxAscent : m.size * 0.88;
  const desc = Number.isFinite(tm.fontBoundingBoxDescent) ? tm.fontBoundingBoxDescent : m.size * 0.22;
  // DOM 라인 박스와 같은 자리에 베이스라인을 놓는다: 반쪽 리딩 + 어센트
  rx.fillText(text, m.pad, m.pad + (m.boxH - (asc + desc)) / 2 + asc);

  const n = fw * fh;
  const data = rx.getImageData(0, 0, fw, fh).data;
  const a = new Float32Array(n);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = data[i * 4 + 3] / 255;

  const r = Math.max(1, Math.round(m.size * BLUR_K * (fw / m.w)));
  for (let p = 0; p < 3; p++) {
    blurH(a, b, fw, fh, r);
    blurV(b, a, fw, fh, r);
  }

  let max = 0;
  for (let i = 0; i < n; i++) if (a[i] > max) max = a[i];
  if (max < 1e-4) return null;
  const inv = 1 / max;
  for (let i = 0; i < n; i++) a[i] *= inv;

  const kx = m.w / fw;
  const ky = m.h / fh;
  const s = makeScratch(fw, fh);
  const step = STEP_CSS / Math.max(kx, ky);
  const rings: Ring[][] = [];
  // 낮은 임계값 = 바깥 링, 높은 임계값 = 글자 속 마루. 인덱스 0이 가장 바깥이다.
  for (let i = 0; i < levels; i++) {
    rings.push(trace(a, fw, fh, 0.055 + ((i + 0.5) / levels) * 0.9, step, kx, ky, s));
  }
  return { key: m.key, pad: m.pad, w: m.w, h: m.h, rings };
}

/* ── 그리기 ──────────────────────────────────────────────────────────── */

// 점을 밀어낸 좌표를 담는 재사용 버퍼. 프레임마다 새로 할당하지 않는다.
let SX = new Float32Array(2048);
let SY = new Float32Array(2048);

type PaintOpts = {
  dpr: number;
  intro: number; // 0..1, 이징 적용된 전체 진행도
  accent: number; // 앰버 링의 실수 인덱스
  mx: number;
  my: number;
  amp: number; // 마우스 융기 세기 0..1
  fg: RGBA;
  line: RGBA;
  ac: RGBA;
  dark: boolean;
};

function paint(ctx: CanvasRenderingContext2D, g: Geo, o: PaintOpts) {
  const N = g.rings.length;
  ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
  ctx.clearRect(0, 0, g.w, g.h);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  let dashed = false;

  // 바깥 링은 테마 hairline(--line) 세기를, 안쪽 링은 --fg를 기준으로 삼는다.
  // 라이트 테마에서는 하한 0.36 — 등고선이 곧 글자라 이 밑으로는 읽히지 않는다.
  const lowA = Math.max(o.dark ? 0.24 : 0.36, Math.min(0.5, o.line.a * 2));
  const highA = o.dark ? 0.9 : 1;
  const r2 = BUMP_R * BUMP_R;
  const bump = o.amp > 0.002;

  for (let i = 0; i < N; i++) {
    // 레벨 진행도: 바깥(i=0)이 먼저 그려지고 안쪽이 따라온다
    const start = N > 1 ? (i / (N - 1)) * 0.55 : 0;
    const lp = Math.max(0, Math.min(1, (o.intro - start) / 0.45));
    if (lp <= 0) continue;

    const t = N > 1 ? i / (N - 1) : 1;
    const aw = Math.max(0, 1 - Math.abs(i - o.accent)); // 앰버 가중치(1~2개 레벨만 켜진다)
    const br = o.line.r + (o.fg.r - o.line.r) * t;
    const bg = o.line.g + (o.fg.g - o.line.g) * t;
    const bb = o.line.b + (o.fg.b - o.line.b) * t;
    const baseA = lowA + (highA - lowA) * t;
    const cr = Math.round(br + (o.ac.r - br) * aw);
    const cg = Math.round(bg + (o.ac.g - bg) * aw);
    const cb = Math.round(bb + (o.ac.b - bb) * aw);
    const alpha = (baseA + (1 - baseA) * aw) * lp;
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;

    // 들어오는 동안 살짝 아래에서 올라온다(히어로의 uIntro와 같은 감각)
    const yOff = (1 - lp) * Math.min(10, g.pad * 0.4);
    // 앰버 링만 굵고 흐린 획을 한 번 더 깔아 히어로의 glow를 흉내 낸다. 라이트에서는 생략.
    const glow = o.dark ? aw * 0.16 : 0;

    for (const ring of g.rings[i]) {
      const p = ring.pts;
      const n = p.length / 2;
      if (SX.length < n) {
        SX = new Float32Array(n);
        SY = new Float32Array(n);
      }
      for (let k = 0; k < n; k++) {
        let x = p[k * 2];
        let y = p[k * 2 + 1] + yOff;
        if (bump) {
          const dx = x - o.mx;
          const dy = y - o.my;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2) {
            // 국소 융기: 높이가 올라간 만큼 같은 등고선이 바깥으로 밀려난다
            const u = 1 - d2 / r2;
            const d = Math.sqrt(d2);
            const k2 = (o.amp * BUMP_MAX * u * u) / (d > 1 ? d : 1);
            x += dx * k2;
            y += dy * k2;
          }
        }
        SX[k] = x;
        SY[k] = y;
      }

      if (lp < 1) {
        ctx.setLineDash([ring.len * lp, ring.len + 2]);
        dashed = true;
      } else if (dashed) {
        ctx.setLineDash([]);
        dashed = false;
      }

      ctx.beginPath();
      if (ring.closed) {
        // 중점을 지나는 2차 베지에로 이어 계단 현상을 없앤다(이음매도 자연스럽다)
        ctx.moveTo((SX[n - 1] + SX[0]) * 0.5, (SY[n - 1] + SY[0]) * 0.5);
        for (let k = 0; k < n; k++) {
          const j = k + 1 === n ? 0 : k + 1;
          ctx.quadraticCurveTo(SX[k], SY[k], (SX[k] + SX[j]) * 0.5, (SY[k] + SY[j]) * 0.5);
        }
        ctx.closePath();
      } else {
        ctx.moveTo(SX[0], SY[0]);
        for (let k = 1; k < n - 1; k++) {
          ctx.quadraticCurveTo(SX[k], SY[k], (SX[k] + SX[k + 1]) * 0.5, (SY[k] + SY[k + 1]) * 0.5);
        }
        ctx.lineTo(SX[n - 1], SY[n - 1]);
      }

      if (glow > 0.01) {
        ctx.globalAlpha = glow;
        ctx.lineWidth = 3.2;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}

/* ── 컴포넌트 ────────────────────────────────────────────────────────── */

type Tag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "div" | "span";

type TopoTypeProps = {
  /** 실제 문자열. 한 줄 제목 전용이다(줄바꿈은 지원하지 않는다). */
  text: string;
  as?: Tag;
  className?: string;
  id?: string;
  /** 등고선 개수. 터치 기기에서는 필레이트 때문에 절반으로 줄인다. */
  levels?: number;
};

/** 제목 하나를 자기 글자 모양의 등고선 지도로 그린다. */
export function TopoType({ text, as = "h2", className, id, levels = DEFAULT_LEVELS }: TopoTypeProps) {
  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const theme = useTheme();
  const fgVar = useCssVar("--fg", "#e6edeb");
  const lineVar = useCssVar("--line", "rgba(230,237,235,0.14)");
  const acVar = useCssVar("--accent", "#f2b544");

  const boxRef = useRef<HTMLSpanElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const geoRef = useRef<Geo | null>(null);
  const startRef = useRef(0); // 인트로 시작 시각(ms). 테마가 바뀌어도 다시 재생하지 않는다.
  const [painted, setPainted] = useState(false);

  const inView = useInView(boxRef, "180px");
  // 모션 최소화·터치: 루프 없이 완성된 정지 화면 한 장. 터치는 레벨도 절반.
  const live = !reduced && !coarse;
  const count = Math.max(3, coarse ? Math.round(levels / 2) : levels);

  useEffect(() => {
    const box = boxRef.current;
    const cv = cvRef.current;
    if (!box || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return; // 2D 컨텍스트가 없으면 진짜 텍스트가 그대로 보인다(폴백)

    const fg = parseColor(fgVar, FG_FB);
    const line = parseColor(lineVar, LINE_FB);
    const ac = parseColor(acVar, AC_FB);
    const dark = theme === "dark";

    let dpr = 1;
    let raf = 0;
    let pend = 0;
    let dead = false;

    /** 지오메트리를 (키가 바뀐 경우에만) 다시 만들고 캔버스 백버퍼를 맞춘다. */
    const sync = () => {
      const m = measure(box, text, count);
      if (!m) return false;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!geoRef.current || geoRef.current.key !== m.key) {
        const g = build(text, count, m);
        if (!g) return false;
        geoRef.current = g;
      }
      const g = geoRef.current;
      const bw = Math.round(g.w * dpr);
      const bh = Math.round(g.h * dpr);
      if (cv.width !== bw || cv.height !== bh) {
        cv.width = bw;
        cv.height = bh;
      }
      cv.style.width = `${g.w}px`;
      cv.style.height = `${g.h}px`;
      // 글자 박스 바깥으로 pad만큼 번지지만 absolute라 레이아웃은 그대로다
      cv.style.left = `${-g.pad}px`;
      cv.style.top = `${-g.pad}px`;
      return true;
    };

    /** effect 본문에서 직접 setState하지 않는다(React 컴파일러 규칙). */
    const markPainted = () => {
      requestAnimationFrame(() => {
        if (!dead) setPainted(true);
      });
    };

    const still = () => {
      const g = geoRef.current;
      if (!g) return;
      paint(ctx, g, {
        dpr,
        intro: 1,
        accent: (count - 1) * 0.58,
        mx: -9999,
        my: -9999,
        amp: 0,
        fg,
        line,
        ac,
        dark,
      });
    };

    // 리사이즈 콜백은 rAF 한 개로 묶는다(레이아웃 읽기가 RO 안에서 연쇄되지 않도록).
    let onLayout = () => {};
    const schedule = () => {
      if (pend) return;
      pend = requestAnimationFrame(() => {
        pend = 0;
        if (!dead) onLayout();
      });
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(box);
    // 웹폰트가 늦게 붙으면 글리프가 바뀌므로 한 번 더 굽는다
    if (document.fonts) document.fonts.ready.then(schedule).catch(() => {});

    if (!live) {
      onLayout = () => {
        if (sync()) still();
      };
      if (sync()) {
        still();
        markPainted();
      }
      return () => {
        dead = true;
        ro.disconnect();
        if (pend) cancelAnimationFrame(pend);
      };
    }

    if (!inView) {
      // 화면 밖: 지오메트리만 미리 구워 두고 루프는 돌리지 않는다.
      onLayout = () => {
        sync();
      };
      schedule();
      return () => {
        dead = true;
        ro.disconnect();
        if (pend) cancelAnimationFrame(pend);
      };
    }

    onLayout = () => {
      sync();
    }; // 루프가 다음 프레임에 알아서 새 지오메트리를 그린다
    if (!sync()) {
      return () => {
        dead = true;
        ro.disconnect();
        if (pend) cancelAnimationFrame(pend);
      };
    }

    let tx = -9999;
    let ty = -9999;
    let mx = -9999;
    let my = -9999;
    let amp = 0;
    let had = false;
    let seenPtr = false;

    const onMove = (e: PointerEvent) => {
      seenPtr = true;
      tx = e.clientX;
      ty = e.clientY;
    };
    const onOut = () => {
      seenPtr = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointercancel", onOut, { passive: true });
    document.addEventListener("pointerleave", onOut);
    window.addEventListener("blur", onOut);

    let first = true;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const g = geoRef.current;
      if (!g) return;
      if (!startRef.current) startRef.current = now;

      // 포인터 → 캔버스 좌표. 프레임당 레이아웃 읽기는 이 한 번뿐.
      const r = cv.getBoundingClientRect();
      const near =
        seenPtr &&
        tx > r.left - BUMP_R &&
        tx < r.right + BUMP_R &&
        ty > r.top - BUMP_R &&
        ty < r.bottom + BUMP_R;
      if (near) {
        const gx = tx - r.left;
        const gy = ty - r.top;
        if (had) {
          mx += (gx - mx) * 0.25;
          my += (gy - my) * 0.25;
        } else {
          mx = gx;
          my = gy;
        }
      }
      had = near;
      // 들어올 땐 빠르게, 나가면 천천히 풀린다(스프링백)
      amp += ((near ? 1 : 0) - amp) * (near ? 0.2 : 0.09);

      paint(ctx, g, {
        dpr,
        intro: ease(Math.min(1, (now - startRef.current) / INTRO_MS)),
        // 한 층이 앰버로 천천히 이동한다. 주기 약 28초 — 히어로의 강조선과 같은 리듬.
        accent: (count - 1) * (0.5 + 0.48 * Math.sin(now * 0.00022)),
        mx,
        my,
        amp,
        fg,
        line,
        ac,
        dark,
      });

      if (first) {
        first = false;
        markPainted();
      }
    };
    raf = requestAnimationFrame(step);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      if (pend) cancelAnimationFrame(pend);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointercancel", onOut);
      document.removeEventListener("pointerleave", onOut);
      window.removeEventListener("blur", onOut);
    };
  }, [text, count, live, inView, theme, fgVar, lineVar, acVar]);

  return createElement(
    as,
    { id, className, "aria-label": text },
    <span
      ref={boxRef}
      className="relative inline-block"
      // 캔버스가 그려지면 진짜 글자는 투명해진다. 박스는 그대로 남아 레이아웃이 밀리지 않고
      // 선택·복사와 스크린리더는 계속 원문을 읽는다.
      style={{ whiteSpace: "pre", color: painted ? "transparent" : undefined, transition: "color 260ms ease" }}
    >
      {text}
      <canvas ref={cvRef} aria-hidden className="pointer-events-none absolute left-0 top-0 block" />
    </span>,
  );
}
