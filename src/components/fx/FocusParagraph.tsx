"use client";

import { useEffect, useMemo, useRef } from "react";
import { useScroll } from "framer-motion";
import { useCanAnimate, useInView, useNarrowViewport, useTheme } from "@/lib/useEnv";

/* 읽는 리듬을 주는 문단.
   문단이 읽기 구간(뷰포트 85% → 25%)을 지나는 동안 아직 안 읽은 단어는 흐리게,
   지나온 단어는 또렷하게 돌아온다. 등고선처럼 "지금 읽는 자리"에 선이 지나가는 느낌.

   지키는 것 세 가지:
   - 정보는 절대 사라지지 않는다. 최저 불투명도는 라이트 0.35 / 다크 0.3이고,
     효과가 꺼진 환경에서는 span 없이 평범한 <p> 그대로다. 텍스트는 언제나 선택·복사된다.
   - 줄바꿈 동결. 공백은 span 밖 텍스트 노드로 그대로 두고 단어만 inline-block으로 감싼다.
     줄바꿈 기회는 원본과 같은 자리(공백)에만 생기므로 레이아웃이 한 글자도 흔들리지 않는다.
   - 리렌더 0회. 스크롤 진행도는 MotionValue 구독 한 개로 받아 style.opacity만 직접 쓴다.
     자체 rAF 루프는 없고, 화면 밖이면 구독 자체를 끊는다(useInView). */

const MIN_LIGHT = 0.35; // 라이트 테마 최저 불투명도 — 이 아래로는 절대 안 내려간다
const MIN_DARK = 0.3; // 다크 테마 최저 불투명도
const SPREAD = 0.7; // 마지막 단어가 밝아지기 시작하는 진행도(0.7 → 끝나기 전에 다 켜진다)
const RAMP = 0.22; // 단어 하나가 흐림→또렷으로 가는 구간 길이. 넓을수록 여러 단어가 겹쳐 번진다
const MAX_BLUR = 0.9; // px. 데스크톱 전용, 모바일은 0
const STEP = 0.02; // 불투명도 양자화 간격. 값이 같으면 스타일을 안 건드려 불필요한 repaint를 막는다

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 3t²-2t³ — 켜지고 꺼지는 양 끝을 부드럽게 */
const smooth = (t: number) => t * t * (3 - 2 * t);

const SPACE = /^\s+$/;

type FocusParagraphProps = {
  /** 문단 텍스트. children으로 넘겨도 된다. */
  text?: string;
  children?: string;
  className?: string;
};

export function FocusParagraph({ text, children, className }: FocusParagraphProps) {
  const source = text ?? children ?? "";
  const ref = useRef<HTMLParagraphElement>(null);

  const canAnimate = useCanAnimate(); // 모션 감소 또는 터치 기기면 false
  const narrow = useNarrowViewport();
  const theme = useTheme();
  const inView = useInView(ref, "10%");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.25"] });

  // 공백을 잃지 않는 분해: ["기능을", " ", "더하는", ...]. count는 단어(공백 아닌 토큰) 개수.
  const { parts, count } = useMemo(() => {
    const list = source.split(/(\s+)/).filter((t) => t.length > 0);
    return { parts: list, count: list.filter((t) => !SPACE.test(t)).length };
  }, [source]);

  const min = theme === "light" ? MIN_LIGHT : MIN_DARK;
  const maxBlur = narrow ? 0 : MAX_BLUR; // 모바일에서는 블러 없음
  const active = canAnimate && inView;

  useEffect(() => {
    const el = ref.current;
    if (!active || !el || count === 0) return;
    const spans = Array.from(el.querySelectorAll<HTMLSpanElement>("[data-focus-word]"));
    // 언어 토글 직후처럼 렌더와 DOM이 어긋나면 이번 커밋은 건너뛴다(다음 커밋에서 맞는다).
    if (spans.length !== count) return;

    const prev = new Array<number>(spans.length).fill(-1); // 직전에 쓴 값 — 같으면 건너뛴다

    const apply = (p: number) => {
      for (let i = 0; i < spans.length; i++) {
        const start = (spans.length === 1 ? 0 : i / (spans.length - 1)) * SPREAD;
        const e = smooth(clamp01((p - start) / RAMP)); // 0=아직 안 읽음, 1=지나옴
        const o = Math.round((min + (1 - min) * e) / STEP) * STEP;
        if (o === prev[i]) continue;
        prev[i] = o;
        const s = spans[i].style;
        if (o >= 1) {
          // 다 읽은 단어는 인라인 스타일을 비워 기본값(불투명도 1)으로 되돌린다.
          s.opacity = "";
          s.filter = "";
        } else {
          s.opacity = o.toFixed(2);
          const b = Math.round((1 - e) * maxBlur * 10) / 10;
          s.filter = b > 0.05 ? `blur(${b}px)` : "";
        }
      }
    };

    apply(scrollYProgress.get()); // 구독 전에 현재 위치를 한 번 반영해 깜빡임을 막는다
    const unsubscribe = scrollYProgress.on("change", apply);
    return () => {
      unsubscribe();
      for (const span of spans) {
        span.style.opacity = "";
        span.style.filter = "";
      }
    };
  }, [active, count, min, maxBlur, scrollYProgress]);

  // 모션 감소·터치 기기: 단어 span을 아예 만들지 않는다. 문단은 100% 정상.
  if (!canAnimate) {
    return (
      <p ref={ref} className={className}>
        {source}
      </p>
    );
  }

  return (
    <p ref={ref} className={className}>
      {parts.map((tok, i) =>
        SPACE.test(tok) ? (
          tok // 공백은 텍스트 노드 그대로 — 줄바꿈 기회가 원본과 동일해진다
        ) : (
          <span key={i} data-focus-word="" className="inline-block">
            {tok}
          </span>
        ),
      )}
    </p>
  );
}
