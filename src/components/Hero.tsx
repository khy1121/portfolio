"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";
import { useSite } from "./Providers";
import { copy } from "@/lib/content";
import { Magnetic } from "./Magnetic";
import { Intro } from "./Intro";
import { useInView } from "@/lib/useEnv";

const TerrainField = dynamic(() => import("./TerrainField"), { ssr: false });

const ease = [0.16, 1, 0.3, 1] as const;

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
function getReduced() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* 글자 하나: 마스크 리빌로 올라오고, 마우스가 가까우면 굵어진다 */
function Letter({
  ch,
  delay,
  started,
  registry,
}: {
  ch: string;
  delay: number;
  started: boolean;
  registry: React.RefObject<HTMLSpanElement[]>;
}) {
  return (
    <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
      <motion.span
        ref={(el) => {
          if (el && !registry.current.includes(el)) registry.current.push(el);
        }}
        className="inline-block will-change-transform"
        initial={{ y: "110%" }}
        animate={started ? { y: 0 } : { y: "110%" }}
        transition={{ duration: 1.1, delay, ease }}
      >
        <span className="hero-letter inline-block">{ch}</span>
      </motion.span>
    </span>
  );
}

export function Hero() {
  const { lang } = useSite();
  const t = copy[lang].hero;
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef(0);
  const introRef = useRef(0);
  const letters = useRef<HTMLSpanElement[]>([]);
  const [started, setStarted] = useState(false);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const heroVisible = useInView(ref, "0px", true);

  const onIntroDone = useCallback(() => {
    introRef.current = 1;
    setStarted(true);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollRef.current = v;
  });
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const textO = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // 마우스 거리 → 글자 굵기(가변 폰트 wght 420~800)와 기울기
  useEffect(() => {
    if (reduced || window.matchMedia("(pointer: coarse)").matches) return;
    let raf = 0;
    let mx = -9999;
    let my = -9999;
    const tick = () => {
      for (const wrap of letters.current) {
        const el = wrap.firstElementChild as HTMLElement | null;
        if (!el) continue;
        const r = wrap.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const d = Math.hypot(mx - cx, my - cy);
        const k = Math.max(0, 1 - d / 260);
        const w = Math.round(800 - k * 380);
        el.style.fontVariationSettings = `"wght" ${w}`;
        el.style.transform = `skewX(${(-k * 7).toFixed(1)}deg) scaleY(${(1 + k * 0.06).toFixed(3)})`;
      }
      raf = 0;
    };
    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      mx = -9999;
      my = -9999;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const lines = ["HEON", "YEONG"];

  return (
    <section ref={ref} id="top" className="relative h-[100svh] overflow-hidden">
      <Intro onDone={onIntroDone} />

      <div className="absolute inset-0">
        {!reduced ? (
          <TerrainField scrollRef={scrollRef} introRef={introRef} active={heroVisible} />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 70% 40%, color-mix(in srgb, var(--fg) 10%, transparent), transparent 70%)",
            }}
          />
        )}
      </div>

      <motion.div
        style={{ y: textY, opacity: textO }}
        className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-between px-5 pb-8 pt-24 md:px-10 md:pb-12"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: started ? 1 : 0 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="ml-auto max-w-[34ch] text-right text-sm leading-relaxed text-muted md:text-base"
        >
          {t.line1}
          <br />
          {t.line2}
        </motion.p>

        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h1 className="hero-title flex-none whitespace-nowrap text-[min(13.5vw,11.5rem)]">
            {lines.map((line, li) => (
              <span key={line} className="block">
                {line.split("").map((ch, i) => (
                  <Letter key={ch + i} ch={ch} delay={0.05 + li * 0.12 + i * 0.045} started={started} registry={letters} />
                ))}
              </span>
            ))}
          </h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: started ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="flex flex-col items-start gap-5 md:items-end"
          >
            <p className="font-display text-sm font-semibold tracking-wide text-muted">{t.role}</p>
            <div className="flex gap-3">
              <Magnetic strength={0.25}>
                <a
                  href="#work"
                  className="whitespace-nowrap rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:bg-accent"
                >
                  {t.cta1}
                </a>
              </Magnetic>
              <Magnetic strength={0.25}>
                <a
                  href="/resume.pdf"
                  className="whitespace-nowrap rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-fg"
                >
                  {t.cta2}
                </a>
              </Magnetic>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: started ? 1 : 0 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs text-muted md:flex"
      >
        <span className="block h-8 w-px overflow-hidden bg-line">
          <motion.span
            className="block h-full w-full bg-fg"
            animate={{ y: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          />
        </span>
        {t.hint}
      </motion.div>
    </section>
  );
}
