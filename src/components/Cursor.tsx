"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

function subscribePointer(cb: () => void) {
  const a = window.matchMedia("(pointer: fine)");
  const b = window.matchMedia("(prefers-reduced-motion: reduce)");
  a.addEventListener("change", cb);
  b.addEventListener("change", cb);
  return () => {
    a.removeEventListener("change", cb);
    b.removeEventListener("change", cb);
  };
}
function getPointerSnapshot() {
  return (
    window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Cursor() {
  const enabled = useSyncExternalStore(subscribePointer, getPointerSnapshot, () => false);
  const [hover, setHover] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.3 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.3 });

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("has-cursor");
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as HTMLElement | null;
      setHover(!!target?.closest("a, button, [data-hover]"));
    };
    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      document.body.classList.remove("has-cursor");
    };
  }, [enabled, x, y]);

  if (!enabled) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] rounded-full mix-blend-difference"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: hover ? 56 : 14,
        height: hover ? 56 : 14,
        backgroundColor: "#e6edeb",
        transition: "width 0.25s cubic-bezier(.2,.8,.2,1), height 0.25s cubic-bezier(.2,.8,.2,1)",
      }}
    />
  );
}
