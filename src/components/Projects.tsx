"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { useSite } from "./Providers";
import { copy, projects, type Project } from "@/lib/content";
import { ProjectStage } from "./ProjectStage";
import { ImageTrail } from "./ImageTrail";
import { RaceSim } from "@/components/fx/RaceSim";
import { GuardMachine } from "@/components/fx/GuardMachine";
import { Scramble } from "@/components/fx/Scramble";

function Card({ p, index, total }: { p: Project; index: number; total: number }) {
  const { lang } = useSite();
  const t = copy[lang].work;
  const ref = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  /* 카드가 화면보다 크면 sticky top을 위로(음수까지) 내려서 카드 바닥까지 읽히게 한다.
     그대로 두면 12vh에 고정된 채 아래가 잘려 스크롤로도 못 본다. */
  const [stickyTop, setStickyTop] = useState<number | null>(null);
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;
    const compute = () => {
      const base = window.innerHeight * 0.12 + index * 14;
      const maxTop = window.innerHeight - el.getBoundingClientRect().height - 24;
      setStickyTop(Math.min(base, maxTop));
    };
    let raf = 0;
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; compute(); });
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [index]);

  // stack: as the next card arrives, this one shrinks and dims slightly
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 12%", "end 12%"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, 0.45]);

  // tilt on hover
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glow = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(520px circle at ${x}% ${y}%, ${p.accent}22, transparent 60%)`,
  );

  return (
    <div
      ref={ref}
      className="sticky mb-[6vh]"
      style={{ top: stickyTop ?? `calc(12vh + ${index * 14}px)`, zIndex: index + 1 }}
    >
      <motion.article
        ref={articleRef}
        style={{ scale, rotateX: srx, rotateY: sry, transformPerspective: 1400, transformOrigin: "top center" }}
        onMouseMove={(e) => {
          if (window.matchMedia("(pointer: coarse)").matches) return;
          const r = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          ry.set((px - 0.5) * 6);
          rx.set((0.5 - py) * 6);
          glowX.set(px * 100);
          glowY.set(py * 100);
        }}
        onMouseLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        className="relative overflow-hidden rounded-[28px] border border-line bg-card"
      >
        <motion.div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
        <motion.div className="pointer-events-none absolute inset-0 bg-bg" style={{ opacity: dim }} />

        <div className="relative grid gap-6 p-5 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:p-8">
          <div className="flex flex-col gap-8 md:py-4 md:pl-4">
            <div>
              <div className="flex items-center gap-3 text-sm text-muted">
                <span className="font-display font-semibold tabular-nums">
                  {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
                </span>
                <span>{p.period}</span>
              </div>
              <p className="mt-5 inline-block rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: `${p.accent}22`, color: p.accent }}>
                {p.kind}
              </p>
              <h3 className="display mt-3 text-[clamp(2.2rem,5.5vw,4.2rem)]">{p.title}</h3>
              <p className="mt-4 max-w-[44ch] text-base leading-relaxed text-muted md:text-lg">{p.summary[lang]}</p>
              <p className="mt-2 text-sm text-muted">{p.role[lang]}</p>
            </div>

            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted">{t.problem}</dt>
                <dd className="mt-1 leading-relaxed">{p.problem[lang]}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">{t.result}</dt>
                <dd className="mt-1 leading-relaxed">{p.result[lang]}</dd>
              </div>
            </dl>

            {p.slug === "omfres" && <RaceSim className="max-w-[520px]" />}
            {p.slug === "boardingpass" && <GuardMachine />}

            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="flex gap-8">
                {p.stats.map((s) => (
                  <div key={s.value}>
                    <div className="font-display text-3xl font-bold tabular-nums md:text-4xl" style={{ color: p.accent }}>
                      {s.value}
                    </div>
                    <div className="mt-1 text-xs text-muted">{s.label[lang]}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm font-semibold">
                <a href={p.repo} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                  {t.repo}
                </a>
                {p.demo && (
                  <a href={p.demo} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                    {t.demo}
                  </a>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {p.stack.map((s) => (
                <span key={s} className="rounded-full border border-line px-3 py-1 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <ProjectStage p={p} tiltX={srx} tiltY={sry} />
        </div>
      </motion.article>
    </div>
  );
}

export function Projects() {
  const { lang } = useSite();
  const t = copy[lang].work;
  return (
    <section id="work" className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10 md:pt-40">
      <ImageTrail className="mb-10 -mx-5 px-5 py-10 md:-mx-10 md:px-10 md:py-16">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <Scramble as="h2" text={t.title} className="display whitespace-nowrap text-[clamp(2.6rem,6.5vw,5.5rem)]" />
          <p className="max-w-[36ch] text-muted md:text-lg">{t.lead}</p>
        </div>
      </ImageTrail>
      <div className="pb-[12vh]">
        {projects.map((p, i) => (
          <Card key={p.slug} p={p} index={i} total={projects.length} />
        ))}
      </div>
    </section>
  );
}
