"use client";

import { useCallback, useEffect, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { AsciiRenderer } from "@react-three/drei";
import { useCoarsePointer, useCssVar, usePrefersReducedMotion, useTheme } from "@/lib/useEnv";

/* AsciiPass — 놀이터의 3D 씬을 터미널 아스키로 다시 그리는 패스.

   drei의 <AsciiRenderer>는 renderIndex 1로 렌더 루프를 가져간다.
   R3F는 우선순위 1 이상인 useFrame이 하나라도 있으면 자동 렌더를 멈추므로,
   자동차 물리·파티클·추격 카메라(우선순위 0)는 그대로 돌고 맨 마지막에 아스키가 한 번 그린다.
   WebGL 캔버스는 opacity 0이 되고 문자 표가 그 위에 pointer-events: none으로 얹히니
   키보드 운전도 터치 조이스틱도 그대로 살아 있다. */

const STORAGE_KEY = "playground-ascii";

/* 밝기 = 고도. 히어로 등고선과 같은 읽기 방식이라 밝은 면일수록 문자가 촘촘해진다. */
const RAMP = " .:-=+*#%@";

/* 아스키는 원본 픽셀을 그대로 쓰지 않고 밝기만 읽어 축소한다. 소스 버퍼를 1배로 낮춰도 결과가 같다. */
export const ASCII_DPR: [number, number] = [1, 1];

/** 켜져 있는 동안 씬 전체를 문자로 다시 그린다. 반드시 <Canvas> 안에서 쓸 것. */
export function AsciiPass() {
  const dark = useTheme() === "dark";
  const fg = useCssVar("--fg", "#e6edeb");
  const coarse = useCoarsePointer();
  const reduced = usePrefersReducedMotion();

  /* 문자 크기는 2/resolution이라 값이 낮을수록 글자가 굵고 개수가 준다.
     터치 기기는 화면이 좁아 굵게, 모션 최소화도 같은 값으로 둔다(바뀌는 글자 수가 줄어 덜 떨린다). */
  const resolution = coarse || reduced ? 0.12 : 0.15;

  return (
    <>
      {/* 밝기 잣대가 될 배경. 화면에 보이는 색이 아니라(캔버스는 opacity 0) 문자 밀도의 기준면이다.
          다크는 검정 기준 + invert라 "밝은 곳이 촘촘", 라이트는 흰 기준이라 "어두운 곳이 촘촘"해진다.
          어느 쪽이든 빈 공간은 공백으로 떨어져 터미널처럼 깨끗하게 비고, 실제 색은 --fg/--card가 낸다. */}
      <color attach="background" args={[dark ? "#000000" : "#ffffff"]} />
      <AsciiRenderer
        renderIndex={1}
        characters={RAMP}
        invert={dark}
        fgColor={fg}
        bgColor="transparent"
        resolution={resolution}
      />
    </>
  );
}

/** 아스키 모드 on/off + localStorage 유지. */
export function useAsciiMode() {
  const [ascii, setAscii] = useState(false);
  const [ready, setReady] = useState(false);

  // 저장값은 마운트 뒤 rAF에서 읽는다(effect 본문에서 바로 setState 금지 + 하이드레이션 불일치 방지).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(STORAGE_KEY);
      } catch {}
      if (saved === "1") setAscii(true);
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // 읽기가 끝난 뒤에만 쓴다. 안 그러면 기본값 off가 저장값을 덮어쓴다.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, ascii ? "1" : "0");
    } catch {}
  }, [ascii, ready]);

  const toggle = useCallback(() => setAscii((v) => !v), []);
  return { ascii, toggle };
}

/** 캔버스 위에 얹는 전환 버튼. 라벨은 "다음에 갈 모드", 상태는 aria-pressed가 말한다. */
export function AsciiToggle({ ascii, onToggle }: { ascii: boolean; onToggle: () => void }) {
  const coarse = useCoarsePointer();
  // 터치에서는 캔버스의 조이스틱 핸들러가 이 탭을 가져가지 않도록 여기서 끊는다.
  const swallow = useCallback((e: ReactPointerEvent<HTMLButtonElement>) => e.stopPropagation(), []);

  return (
    <button
      type="button"
      aria-pressed={ascii}
      aria-label={ascii ? "아스키 렌더 끄고 3D로 보기" : "아스키 렌더로 보기"}
      onClick={onToggle}
      onPointerDown={swallow}
      className={`absolute right-4 top-4 z-10 rounded-full border bg-bg/70 font-display text-xs tracking-[0.12em] backdrop-blur transition-colors ${
        coarse ? "px-4 py-2.5" : "px-3 py-1.5"
      } ${ascii ? "border-accent/60 text-accent" : "border-line text-muted hover:border-fg hover:text-fg"}`}
    >
      {ascii ? "3D" : "ASCII"}
    </button>
  );
}
