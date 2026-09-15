"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { mulberry32 } from "@/lib/rng";
import { useCoarsePointer, usePrefersReducedMotion } from "@/lib/useEnv";

/* 등고선 글리프 스크램블.
   섹션 제목이 화면에 들어오는 순간 글자를 지형 기호로 떨다가 왼쪽부터 확정한다.
   - 접근성: 진짜 문자열은 항상 DOM에 그대로 있고(opacity 0), 애니메이션 층은 aria-hidden.
     따라서 스크린리더가 읽는 이름과 복사되는 텍스트는 한 번도 바뀌지 않는다.
   - 레이아웃: 진짜 문자열이 그대로 박스를 차지하고, 스크램블 층은 그 위에 absolute로 겹친다.
     글자 수도 유지하므로 줄바꿈 위치가 흔들리지 않는다. */

/** 라틴·숫자·기호 자리에 넣을 등고선 기호 */
const LATIN_POOL = "/\\~=-+01:.";
/** 한글 자리에 넣을 자모. 전각이라 음절과 글자 폭이 같다. */
const JAMO_POOL = "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊ";

const TICK_MS = 48; // 글리프가 바뀌는 간격. 이보다 빠르면 뭉개져 보인다.

function poolFor(ch: string) {
  const c = ch.codePointAt(0) ?? 0;
  const hangul =
    (c >= 0x1100 && c <= 0x11ff) || (c >= 0x3130 && c <= 0x318f) || (c >= 0xac00 && c <= 0xd7a3);
  // 한글과 CJK 전각 문자는 자모로, 나머지는 라틴 기호로 바꿔 폭 변화를 막는다.
  return hangul || c >= 0x2e80 ? JAMO_POOL : LATIN_POOL;
}

/** 공백류는 절대 바꾸지 않는다(단어 경계가 흔들리면 줄바꿈이 튄다). */
function isFixed(ch: string) {
  return ch.trim() === "";
}

/** 텍스트에서 뽑은 결정적 시드. 렌더 중 Math.random()을 쓰지 않기 위함. */
function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Frame = { src: string; out: string; revealed: number; running: boolean };

function idle(text: string): Frame {
  return { src: text, out: text, revealed: Array.from(text).length, running: false };
}

/** rAF 한 개로 도는 스크램블 엔진. duration이 끝나면 스스로 멈춘다. */
function useScrambleEngine(text: string, duration: number) {
  const [frame, setFrame] = useState<Frame>(() => idle(text));
  const rafRef = useRef(0);
  const runsRef = useRef(0);

  // text가 바뀌면(언어 토글 등) 이전 프레임은 버린다. 렌더 중 setState는 금지라 파생으로 처리.
  const live = frame.src === text ? frame : idle(text);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;

    const chars = Array.from(text);
    const n = chars.length;
    if (n === 0) return;

    // 같은 요소를 다시 스크램블할 때 같은 순열이 반복되지 않도록 실행 횟수를 시드에 섞는다.
    const seed = (hashSeed(text) ^ Math.imul(runsRef.current + 1, 0x9e3779b1)) >>> 0;
    runsRef.current += 1;

    const t0 = performance.now();
    let lastOut = "";
    let lastRevealed = -1;

    const step = (now: number) => {
      const e = now - t0;
      if (e >= duration) {
        rafRef.current = 0;
        setFrame(idle(text));
        return;
      }
      // 길이와 무관하게 duration 안에서 왼쪽부터 균등하게 확정된다.
      const revealed = Math.max(0, Math.min(n, Math.floor((e / duration) * n)));
      const rand = mulberry32(seed ^ Math.imul(Math.floor(e / TICK_MS) + 1, 0x85ebca6b));
      let out = "";
      for (let i = 0; i < n; i++) {
        const ch = chars[i];
        if (i < revealed || isFixed(ch)) {
          out += ch;
          continue;
        }
        const pool = poolFor(ch);
        out += pool[Math.floor(rand() * pool.length)];
      }
      if (out !== lastOut || revealed !== lastRevealed) {
        lastOut = out;
        lastRevealed = revealed;
        setFrame({ src: text, out, revealed, running: true });
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [text, duration]);

  useEffect(() => stop, [stop]);

  return { out: live.out, revealed: live.revealed, running: live.running, start };
}

type BodyProps = {
  text: string;
  out: string;
  revealed: number;
  running: boolean;
  // React 19에서는 ref도 평범한 prop이다. 관찰/호버 대상은 이 안쪽 span.
  ref?: React.Ref<HTMLSpanElement>;
};

function Body({ text, out, revealed, running, ref }: BodyProps) {
  const chars = Array.from(out);
  return (
    <span ref={ref} className="relative inline-block">
      {/* 진짜 텍스트: 레이아웃·접근성·복사 담당. 애니메이션 중에만 투명해진다. */}
      <span className={running ? "opacity-0" : undefined}>{text}</span>
      {running ? (
        <span aria-hidden className="pointer-events-none absolute inset-0 select-none">
          {chars.map((ch, i) => (
            // 아직 확정되지 않은 글자는 앰버로 떨고, 확정되면 본문 색으로 내려앉는다.
            <span key={i} className={i < revealed ? undefined : "text-accent"}>
              {ch}
            </span>
          ))}
        </span>
      ) : null}
    </span>
  );
}

type Tag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div" | "li" | "strong" | "em";

type ScrambleProps = {
  text: string;
  as?: Tag;
  className?: string;
  id?: string;
  /** 전체 완료까지 걸리는 시간(ms). 글자 수와 무관하다. */
  duration?: number;
  /** IntersectionObserver rootMargin */
  rootMargin?: string;
};

/** 뷰포트에 처음 들어올 때 한 번 해독되는 텍스트. */
export function Scramble({
  text,
  as = "span",
  className,
  id,
  duration = 700,
  rootMargin = "0px 0px -12% 0px",
}: ScrambleProps) {
  const reduced = usePrefersReducedMotion();
  const { out, revealed, running, start } = useScrambleEngine(text, duration);
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (reduced) return; // 모션 최소화: 처음부터 완성된 텍스트 그대로.
    const el = hostRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect(); // 요소당 한 번만 돌린다.
        start();
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, rootMargin, start]);

  return createElement(
    as,
    { id, className },
    <Body ref={hostRef} text={text} out={out} revealed={revealed} running={running} />,
  );
}

type HoverProps = ScrambleProps & {
  /** 호버를 감지할 조상 선택자. 못 찾으면 자기 자신에 붙는다. */
  triggerSelector?: string;
};

/** 마우스가 올라올 때마다 다시 해독되는 텍스트. 터치 기기에서는 아무 일도 하지 않는다. */
export function ScrambleOnHover({
  text,
  as = "span",
  className,
  id,
  duration = 520,
  triggerSelector = "a,button,[data-scramble-trigger]",
}: HoverProps) {
  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const enabled = !reduced && !coarse;
  const { out, revealed, running, start } = useScrambleEngine(text, duration);
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const el = hostRef.current;
    if (!el) return;
    // 링크 안쪽 span에 있어도 링크 전체(패딩 포함) 호버에 반응하도록 조상에 건다.
    const trigger = (triggerSelector ? el.closest(triggerSelector) : null) ?? el;
    const onEnter = () => start();
    trigger.addEventListener("mouseenter", onEnter);
    trigger.addEventListener("focusin", onEnter); // 키보드 탐색에서도 같은 피드백
    return () => {
      trigger.removeEventListener("mouseenter", onEnter);
      trigger.removeEventListener("focusin", onEnter);
    };
  }, [enabled, start, triggerSelector]);

  return createElement(
    as,
    { id, className },
    <Body ref={hostRef} text={text} out={out} revealed={revealed} running={running} />,
  );
}
