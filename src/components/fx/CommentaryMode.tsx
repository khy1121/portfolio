"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCoarsePointer, useNarrowViewport, usePrefersReducedMotion } from "@/lib/useEnv";

/* 감독판 주석 모드.
   "c" 키나 버튼으로 켜면 페이지 위에 주석 카드가 뜨고, 점선 리더 선이 실제 요소를 가리킨다.
   기본은 꺼짐 — 켜지 않은 채용 담당자에게는 리스너 두 개 말고 아무 비용도 들지 않는다.
   켜져 있는 동안에도 스크롤과 링크는 그대로 살아 있다(오버레이는 전부 pointer-events: none). */

const EASE = "cubic-bezier(0.16,1,0.3,1)";
const GUTTER = 20; // 카드가 붙는 좌우 여백
const TOP_GUARD = 88; // 고정 내비 아래
const BOT_GUARD = 24;
const GAP = 10; // 같은 쪽 카드 사이 최소 간격

type Side = "left" | "right";

type Anno = {
  id: string;
  tag: string;
  section: string;
  text: string;
  /** 실제 DOM 선택자. 해당 요소가 없으면 그 주석만 조용히 건너뛴다. */
  sel: string;
  nth: number;
  side: Side;
  /** 대상 사각형 안에서 리더 선이 닿을 지점(0~1) */
  at: [number, number];
};

const ANNOTATIONS: Anno[] = [
  {
    id: "terrain",
    tag: "SHADER",
    section: "히어로 배경",
    text: "fbm 높이맵을 fract로 잘라 fwidth로 안티에일리어싱한 등고선이다. 이미지 텍스처는 0장.",
    sel: "#top canvas",
    nth: 0,
    side: "right",
    at: [0.35, 0.3],
  },
  {
    id: "title",
    tag: "TYPE",
    section: "히어로 제목",
    text: "가변 폰트 wght를 800에서 420까지 마우스 거리로 보간한다. 등장은 글자마다 마스크 리빌.",
    sel: "#top h1",
    nth: 0,
    side: "right",
    at: [0.55, 0.45],
  },
  {
    id: "ticker",
    tag: "MOTION",
    section: "숫자 띠",
    text: "스크롤 속도가 띠의 방향과 기울기를 정한다. 위로 올리면 반대로 흐른다.",
    sel: '[aria-label="핵심 숫자"]',
    nth: 0,
    side: "right",
    at: [0.5, 0.5],
  },
  {
    id: "stack",
    tag: "LAYOUT",
    section: "프로젝트 카드",
    text: "sticky와 스크롤 연동 scale이라 리렌더 없이 카드가 쌓인다.",
    sel: "#work article",
    nth: 1,
    side: "left",
    at: [0.5, 0.06],
  },
  {
    id: "shot",
    tag: "ASSET",
    section: "프로젝트 화면",
    text: "목업이 아니라 실제 배포본을 헤드리스 크롬으로 캡처한 화면이다.",
    sel: '#work img[alt*="실제 화면"]',
    nth: 0,
    side: "right",
    at: [0.5, 0.35],
  },
  {
    id: "car",
    tag: "PERF",
    section: "놀이터",
    text: "물리 엔진 없이 운동학만으로 굴러가는 차. 화면 밖으로 나가면 렌더를 멈춘다.",
    sel: "#play canvas",
    nth: 0,
    side: "left",
    at: [0.3, 0.3],
  },
  {
    id: "rail",
    tag: "MOTION",
    section: "지나온 길",
    text: "스크롤 진행도로 scaleY만 바꾼다. 레이아웃은 건드리지 않는다.",
    sel: "#timeline .origin-top",
    nth: 0,
    side: "right",
    at: [0.5, 0.5],
  },
  {
    id: "clock",
    tag: "DETAIL",
    section: "푸터",
    text: "서울 시각이 지평선의 해 높이를 정한다.",
    sel: "#contact p.tabular-nums",
    nth: 0,
    side: "left",
    at: [0.1, 0.5],
  },
];

/** 범위가 뒤집혀도(폭이 0에 가까운 요소) 터지지 않는 clamp */
function clamp(v: number, lo: number, hi: number) {
  if (hi <= lo) return lo;
  return v < lo ? lo : v > hi ? hi : v;
}

/** 선택자가 안 맞으면 null. 주석 하나가 빠져도 나머지는 그대로 뜬다. */
function pick(a: Anno): HTMLElement | null {
  try {
    return document.querySelectorAll(a.sel).item(a.nth) as HTMLElement | null;
  } catch {
    return null;
  }
}

/** 입력 중이거나 모달이 열려 있으면 단축키를 가로채지 않는다. */
function typingOrModal(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return true;
  return document.querySelector('[aria-modal="true"]') !== null;
}

type Slot = { i: number; ax: number; ay: number; side: Side; w: number; h: number; y: number };

export function CommentaryMode() {
  const reduced = usePrefersReducedMotion();
  const narrow = useNarrowViewport();
  const coarse = useCoarsePointer();

  const [host, setHost] = useState<HTMLElement | null>(null);
  const [on, setOn] = useState(false);
  const [live, setLive] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const touched = useRef(false); // 첫 렌더에서 aria-live가 떠드는 것을 막는다
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const highlight = useRef<{ i: number; until: number } | null>(null);
  const ping = useRef<((ms: number) => void) | null>(null);

  // 포털 대상. 렌더 중 document를 만지지 않으려고 rAF 안에서 잡는다.
  useEffect(() => {
    const id = requestAnimationFrame(() => setHost(document.body));
    return () => cancelAnimationFrame(id);
  }, []);

  const toggle = useCallback(() => {
    touched.current = true;
    setOn((v) => !v);
  }, []);

  // 켤 때 실제로 붙을 주석이 몇 개인지 세어 두고(모바일 목록·안내에 쓴다) 알린다.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!on) {
        setLive([]);
        if (touched.current) setStatus("감독판 주석 모드 꺼짐");
        return;
      }
      const found = ANNOTATIONS.filter((a) => pick(a) !== null).map((a) => a.id);
      setLive(found);
      setStatus(`감독판 주석 모드 켜짐. 주석 ${found.length}개. Escape로 끕니다`);
    });
    return () => cancelAnimationFrame(id);
  }, [on]);

  // 단축키. 한글 자판에서도 먹도록 key가 아니라 code를 본다.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;
      if (typingOrModal(e.target)) return;
      if (e.code === "KeyC") {
        touched.current = true;
        setOn((v) => !v);
      } else if (e.key === "Escape" && on) {
        touched.current = true;
        setOn(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on]);

  /* 위치 추적 루프. 스크롤·리사이즈가 있을 때만 잠깐 돌고 멈춘다.
     한 프레임 안에서 측정을 전부 끝낸 뒤에 쓰기만 해서 레이아웃 스래싱을 피한다. */
  useEffect(() => {
    if (!on) return;

    let raf = 0;
    let until = 0;

    const setShown = (el: HTMLElement, v: boolean) => {
      el.style.opacity = v ? "1" : "0";
      el.style.visibility = v ? "visible" : "hidden";
    };

    const layout = () => {
      const vw = document.documentElement.clientWidth;
      const vh = window.innerHeight;
      const now = performance.now();

      // ---- 읽기 ----
      const slots: Slot[] = [];
      const seen: boolean[] = [];
      if (!narrow) {
        for (let i = 0; i < ANNOTATIONS.length; i++) {
          const a = ANNOTATIONS[i];
          const card = cardRefs.current[i];
          const el = card ? pick(a) : null;
          if (!card || !el) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4) continue;
          if (r.bottom < TOP_GUARD + 8 || r.top > vh - 48) continue; // 화면 밖 주석은 접는다

          // 화면에 걸친 부분 안에서만 선이 닿게 한다. 화면보다 큰 요소는 보이는 구간의 중앙.
          const lt = Math.max(r.left, 12);
          const rt = Math.min(r.right, vw - 12);
          const vt = Math.max(r.top, TOP_GUARD);
          const vb = Math.min(r.bottom, vh - 28);
          const ax = r.width > vw * 1.05 ? (lt + rt) / 2 : clamp(r.left + r.width * a.at[0], lt, rt);
          const ay = r.height > vh * 1.05 ? (vt + vb) / 2 : clamp(r.top + r.height * a.at[1], vt, vb);

          seen[i] = true;
          slots.push({ i, ax, ay, side: a.side, w: card.offsetWidth, h: card.offsetHeight, y: 0 });
        }
      }

      const hl = highlight.current;
      let ringBox: DOMRect | null = null;
      if (hl && now < hl.until) ringBox = pick(ANNOTATIONS[hl.i])?.getBoundingClientRect() ?? null;

      // ---- 계산: 같은 쪽 카드끼리 세로로 밀어 겹치지 않게 ----
      for (const side of ["left", "right"] as const) {
        const col = slots.filter((s) => s.side === side).sort((p, q) => p.ay - q.ay);
        let cursor = TOP_GUARD;
        for (const s of col) {
          s.y = Math.max(cursor, Math.min(s.ay - s.h / 2, vh - BOT_GUARD - s.h));
          cursor = s.y + s.h + GAP;
        }
        // 아래로 넘쳤으면 뒤에서부터 밀어 올린다
        let limit = vh - BOT_GUARD;
        for (let k = col.length - 1; k >= 0; k--) {
          const s = col[k];
          if (s.y + s.h > limit) s.y = limit - s.h;
          limit = s.y - GAP;
        }
        for (const s of col) s.y = Math.max(TOP_GUARD - 60, s.y);
      }

      // ---- 쓰기 ----
      let lines = "";
      let dots = "";
      for (const s of slots) {
        const card = cardRefs.current[s.i];
        if (!card) continue;
        const x = s.side === "left" ? GUTTER : vw - GUTTER - s.w;
        card.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(s.y)}px, 0)`;
        setShown(card, true);

        // 카드 안쪽 모서리에서 짧게 뻗었다가 대상까지 꺾어 간다
        const cx = s.side === "left" ? x + s.w : x;
        const cy = clamp(s.ay, s.y + 14, s.y + s.h - 14);
        const stub = s.side === "left" ? cx + 14 : cx - 14;
        lines += `M${cx.toFixed(1)} ${cy.toFixed(1)}L${stub.toFixed(1)} ${cy.toFixed(1)}L${s.ax.toFixed(1)} ${s.ay.toFixed(1)}`;
        dots += `M${(s.ax - 3).toFixed(1)} ${s.ay.toFixed(1)}a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`;
      }
      for (let i = 0; i < ANNOTATIONS.length; i++) {
        const card = cardRefs.current[i];
        if (card && !seen[i]) setShown(card, false);
      }
      lineRef.current?.setAttribute("d", lines);
      dotRef.current?.setAttribute("d", dots);

      const ring = ringRef.current;
      if (ring) {
        if (ringBox) {
          ring.style.width = `${Math.round(ringBox.width + 12)}px`;
          ring.style.height = `${Math.round(ringBox.height + 12)}px`;
          ring.style.transform = `translate3d(${Math.round(ringBox.left - 6)}px, ${Math.round(ringBox.top - 6)}px, 0)`;
          ring.style.opacity = "1";
        } else {
          ring.style.opacity = "0";
          if (hl && now >= hl.until) highlight.current = null;
        }
      }
    };

    const loop = () => {
      raf = 0;
      if (document.hidden) return;
      layout();
      if (performance.now() < until) raf = requestAnimationFrame(loop);
    };
    const bump = (ms: number) => {
      until = Math.max(until, performance.now() + ms);
      if (!raf) raf = requestAnimationFrame(loop);
    };
    ping.current = bump;

    bump(1600); // 진입 직후 잠깐은 계속 재는다(지연 로드된 캔버스가 뒤늦게 뜬다)
    const onScroll = () => bump(500);
    const onResize = () => bump(700);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.addEventListener("load", onResize);
    document.addEventListener("visibilitychange", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ping.current = null;
      highlight.current = null;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("load", onResize);
      document.removeEventListener("visibilitychange", onResize);
    };
  }, [on, narrow]);

  /* 모바일 시트: 항목을 누르면 그 요소로 스크롤하고 잠깐 테두리로 짚어 준다. */
  const goTo = useCallback((i: number) => {
    const el = pick(ANNOTATIONS[i]);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = Math.max(0, window.scrollY + r.top - (window.innerHeight - Math.min(r.height, window.innerHeight)) / 2);
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(top, { duration: 1.1 });
    else window.scrollTo({ top, behavior: "smooth" });
    highlight.current = { i, until: performance.now() + 2000 };
    ping.current?.(2200);
  }, []);

  if (!host) return null;

  const btnBase =
    "fixed left-5 z-[57] flex items-center gap-2 rounded-full border backdrop-blur-md transition-colors " +
    (coarse ? "min-h-11 px-5 py-3 text-[13px]" : "px-3.5 py-2 text-[12px]");
  const btnTone = on
    ? "border-accent bg-card text-accent"
    : "border-line bg-card/90 text-muted hover:text-fg";

  return createPortal(
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      {/* 딤: 12%만. 클릭은 통과시켜 링크와 스크롤을 막지 않는다 */}
      {on && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[51]"
          style={{ backgroundColor: "var(--bg)", opacity: 0.12 }}
        />
      )}

      {on && !narrow && (
        <>
          <svg aria-hidden className="pointer-events-none fixed inset-0 z-[53] h-full w-full">
            <path ref={lineRef} fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 5" strokeOpacity="0.9" />
            <path ref={dotRef} fill="var(--accent)" />
          </svg>

          <div role="region" aria-label="감독판 주석" className="pointer-events-none fixed inset-0 z-[54]">
            {ANNOTATIONS.map((a, i) => (
              <div
                key={a.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute left-0 top-0 w-[280px] max-w-[280px] rounded-xl border border-line bg-card/95 px-3.5 py-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-sm"
                style={{
                  opacity: 0,
                  visibility: "hidden",
                  willChange: "transform",
                  transition: reduced ? "none" : `opacity 260ms ${EASE}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-accent">{a.tag}</span>
                  <span className="text-[10px] text-muted">{a.section}</span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-fg">{a.text}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 모바일에서 누른 항목을 짚어 주는 테두리 */}
      {on && (
        <div
          ref={ringRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[55] rounded-lg border-2 border-accent"
          style={{
            opacity: 0,
            width: 0,
            height: 0,
            willChange: "transform",
            transition: reduced ? "none" : `opacity 220ms ${EASE}`,
          }}
        />
      )}

      {/* 모바일: 앵커 카드를 놓을 자리가 없으니 목록으로 준다 */}
      {on && narrow && (
        <section
          aria-label="감독판 주석"
          className="fixed inset-x-0 bottom-0 z-[56] max-h-[58svh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-line bg-card/95 backdrop-blur-md"
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-card/95 px-4 py-3 backdrop-blur-md">
            <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-accent">COMMENTARY</span>
            <span className="text-[11px] text-muted">{live.length}개</span>
            <button
              type="button"
              onClick={toggle}
              aria-pressed={on}
              aria-label="감독판 주석 모드 끄기"
              className="ml-auto min-h-10 rounded-full border border-line px-4 text-[12px] font-semibold text-muted"
            >
              닫기
            </button>
          </div>
          <ul>
            {ANNOTATIONS.map((a, i) =>
              live.includes(a.id) ? (
                <li key={a.id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    className="flex w-full flex-col items-start gap-1 px-4 py-3.5 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-accent">{a.tag}</span>
                      <span className="text-[11px] text-muted">{a.section}</span>
                    </span>
                    <span className="text-[13px] leading-relaxed text-fg">{a.text}</span>
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        </section>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label="감독판 주석 모드"
        aria-keyshortcuts="c"
        data-hover
        hidden={on && narrow}
        className={btnBase + " " + btnTone}
        style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <span aria-hidden className="font-mono text-[10px] font-bold tracking-[0.14em]">
          C
        </span>
        <span className="font-display font-bold tracking-tight">주석</span>
      </button>
    </>,
    host,
  );
}
