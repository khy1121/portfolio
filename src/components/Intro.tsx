"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";

const WORDS = ["안녕하세요", "Hello", "김헌영"];
const STEP = 380; // ms per word
const KEY = "intro-seen";

function subscribe() {
  return () => {};
}
function getShouldPlay() {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return sessionStorage.getItem(KEY) !== "1";
  } catch {
    return true;
  }
}

/* 세션당 한 번, 1.1초짜리 인트로 커튼. 끝나면 onDone으로 히어로 지형이 떠오른다. */
export function Intro({ onDone }: { onDone: () => void }) {
  const shouldPlay = useSyncExternalStore(subscribe, getShouldPlay, () => false);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldPlay) {
      onDone();
      return;
    }
    const timers: number[] = [];
    WORDS.forEach((_, i) => {
      if (i > 0) timers.push(window.setTimeout(() => setIdx(i), STEP * i));
    });
    timers.push(
      window.setTimeout(() => {
        setOpen(true);
        try {
          sessionStorage.setItem(KEY, "1");
        } catch {}
        onDone();
      }, STEP * WORDS.length),
    );
    return () => timers.forEach(clearTimeout);
  }, [shouldPlay, onDone]);

  if (!shouldPlay) return null;

  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          key="curtain"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-bg"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        >
          <div className="relative flex items-center gap-3 font-display text-3xl font-bold md:text-5xl">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={idx}
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -18, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {WORDS[idx]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
