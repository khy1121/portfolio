"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const PlaygroundScene = dynamic(() => import("./PlaygroundScene"), { ssr: false });

type Input = { throttle: number; steer: number };

function subscribeCoarse(cb: () => void) {
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getCoarse = () => window.matchMedia("(pointer: coarse)").matches;

export function Playground() {
  const input = useRef<Input>({ throttle: 0, steer: 0 });
  const keys = useRef<Set<string>>(new Set());
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stick, setStick] = useState<{ x: number; y: number } | null>(null);
  const isMobile = useSyncExternalStore(subscribeCoarse, getCoarse, () => false);

  // render only while the section is on screen
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // keyboard: only when the section is on screen; arrows must not scroll the page while driving
  useEffect(() => {
    if (!active) return;
    const apply = () => {
      const k = keys.current;
      const fwd = k.has("ArrowUp") || k.has("KeyW");
      const back = k.has("ArrowDown") || k.has("KeyS");
      const left = k.has("ArrowLeft") || k.has("KeyA");
      const right = k.has("ArrowRight") || k.has("KeyD");
      input.current.throttle = (fwd ? 1 : 0) - (back ? 1 : 0);
      input.current.steer = (right ? 1 : 0) - (left ? 1 : 0);
    };
    const down = (e: KeyboardEvent) => {
      const driving = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"];
      if (!driving.includes(e.code)) return;
      if (e.code.startsWith("Arrow")) e.preventDefault();
      keys.current.add(e.code);
      setFocused(true);
      apply();
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
      apply();
    };
    const keySet = keys.current;
    const inp = input.current;
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keySet.clear();
      inp.throttle = 0;
      inp.steer = 0;
    };
  }, [active]);

  // touch joystick: drag anywhere on the canvas
  const origin = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    origin.current = { x: e.clientX, y: e.clientY };
    setStick({ x: 0, y: 0 });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!origin.current) return;
    const dx = Math.max(-60, Math.min(60, e.clientX - origin.current.x));
    const dy = Math.max(-60, Math.min(60, e.clientY - origin.current.y));
    input.current.steer = dx / 60;
    input.current.throttle = -dy / 60;
    setStick({ x: dx, y: dy });
  };
  const onPointerUp = () => {
    origin.current = null;
    input.current.steer = 0;
    input.current.throttle = 0;
    setStick(null);
  };

  return (
    <section id="play" className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10 md:pt-40">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="display text-[clamp(2.6rem,6.5vw,5.5rem)]">놀이터</h2>
        <p className="max-w-[36ch] text-muted md:text-lg">
          {isMobile ? "화면을 누른 채 끌어서 운전하세요." : "방향키나 WASD로 운전하세요."} 파티클 더미를 뚫고 지나가거나,
          표지판에 부딪히면 그 섹션으로 이동합니다.
        </p>
      </div>
      <div
        ref={box}
        className="relative aspect-[4/3] w-full touch-none overflow-hidden rounded-[28px] border border-line bg-card md:aspect-[21/10]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <PlaygroundScene inputRef={input} active={active} isMobile={isMobile} />

        {!focused && !isMobile && (
          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-line bg-bg/70 px-4 py-2 text-xs text-muted backdrop-blur">
              <kbd className="rounded border border-line px-1.5 py-0.5 font-display">↑</kbd>
              <kbd className="rounded border border-line px-1.5 py-0.5 font-display">←</kbd>
              <kbd className="rounded border border-line px-1.5 py-0.5 font-display">↓</kbd>
              <kbd className="rounded border border-line px-1.5 py-0.5 font-display">→</kbd>
              <span className="ml-1">눌러서 출발</span>
            </div>
          </div>
        )}

        {stick && (
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line"
              style={{ left: "50%", top: "72%" }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-10 w-10 rounded-full bg-fg/80"
                style={{ transform: `translate(calc(-50% + ${stick.x * 0.6}px), calc(-50% + ${stick.y * 0.6}px))` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
