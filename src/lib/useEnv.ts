"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/* 환경 훅 모음.
   React 19 컴파일러 규칙을 지키려고 effect 안에서 setState를 즉시 호출하지 않는다.
   미디어 쿼리는 useSyncExternalStore로, CSS 변수는 rAF + MutationObserver로 읽는다. */

function mediaStore(query: string) {
  return {
    subscribe(cb: () => void) {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    get() {
      return window.matchMedia(query).matches;
    },
  };
}

const reduced = mediaStore("(prefers-reduced-motion: reduce)");
const coarse = mediaStore("(pointer: coarse)");
const narrow = mediaStore("(max-width: 767px)");

/** 사용자가 모션 최소화를 켰는가. SSR에서는 false. */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(reduced.subscribe, reduced.get, () => false);
}

/** 터치 기기인가(마우스 호버가 없는가). SSR에서는 false. */
export function useCoarsePointer() {
  return useSyncExternalStore(coarse.subscribe, coarse.get, () => false);
}

/** 모바일 폭인가. SSR에서는 false. */
export function useNarrowViewport() {
  return useSyncExternalStore(narrow.subscribe, narrow.get, () => false);
}

/** 무거운 연출을 켜도 되는가: 모션 허용 + 마우스 + 충분한 폭. */
export function useCanAnimate() {
  const r = usePrefersReducedMotion();
  const c = useCoarsePointer();
  return !r && !c;
}

/** 현재 테마 문자열. 토글 시 갱신된다. */
export function useTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const root = document.documentElement;
    const read = () => setTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    const id = requestAnimationFrame(read);
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(id);
      obs.disconnect();
    };
  }, []);
  return theme;
}

/** CSS 커스텀 속성 값(예: "--accent")을 읽고 테마가 바뀌면 갱신한다. */
export function useCssVar(name: string, fallback: string) {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const v = getComputedStyle(root).getPropertyValue(name).trim();
      if (v) setValue(v);
    };
    const id = requestAnimationFrame(read);
    const obs = new MutationObserver(() => requestAnimationFrame(read));
    obs.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelAnimationFrame(id);
      obs.disconnect();
    };
  }, [name]);
  return value;
}

/** 렌더 중 호출하지 말 것. rAF 루프 안에서 CSS 변수를 즉시 읽어야 할 때 쓴다. */
export function readCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** 요소가 화면에 보이는 동안만 true. 무거운 캔버스를 화면 밖에서 멈추는 데 쓴다.
 *  처음부터 화면에 있는 요소(히어로 등)는 initial을 true로 줘야 첫 프레임이 그려진다. */
export function useInView<T extends Element>(ref: React.RefObject<T | null>, rootMargin = "200px", initial = false) {
  const [inView, setInView] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
