"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import { useCoarsePointer, useNarrowViewport, usePrefersReducedMotion } from "@/lib/useEnv";

/* SectionRail — 긴 스크롤에 척추를 붙인다.
   왼쪽 여백에 고정된 얇은 레일이 "지금 몇 장인지 / 얼마나 남았는지"를 보여 주고,
   동시에 섹션 이동 네비게이션 역할을 한다.

   챕터 00(#top, 히어로)은 눈금으로 그리지 않는다.
   - 레일은 히어로를 완전히 벗어난 뒤에야 나타나므로 00은 레일이 보이는 동안 절대 활성이 될 수 없다.
     켜지지 않는 눈금과 굴러가지 않는 자리수만 남는다.
   - 맨 위로 가는 링크는 고정 헤더의 "HY"(→ #top)가 화면 같은 쪽 모서리에서 이미 맡고 있다.
   그래서 장은 01~05(프로젝트·놀이터·소개·지나온 길·연락)만 세고, 히어로는 "레일을 숨길지" 판단에만 쓴다. */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const HERO_ID = "top";
const TRACK_H = 210; // 트랙 높이(px)

const SECTIONS = [
  { id: "work", label: "프로젝트" },
  { id: "play", label: "놀이터" },
  { id: "about", label: "소개" },
  { id: "timeline", label: "지나온 길" },
  { id: "contact", label: "연락" },
];

/* 사이트의 부드러운 스크롤을 그대로 쓴다. 모션 최소화면 Lenis가 아예 생성되지 않으므로 기본 스크롤로 떨어진다.
   window.__lenis 전역 선언은 SmoothScroll이 이미 갖고 있어 여기서는 지역 캐스팅만 한다. */
type LenisLike = { scrollTo: (target: Element, opts?: { duration?: number }) => void };
function scrollToSection(el: Element) {
  const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/* 오도미터 한 자리. 글자가 같으면 key가 그대로라 굴러가지 않는다(01 → 11에서 1의 자리는 가만히 있다). */
function Digit({ char, dir, roll }: { char: string; dir: number; roll: boolean }) {
  if (!roll) return <span className="block w-[0.7em] text-center">{char}</span>;
  return (
    <span className="relative block h-[1.3em] w-[0.7em] overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.span
          key={char}
          className="absolute inset-0 flex items-center justify-center"
          initial={{ y: dir > 0 ? "115%" : "-115%" }}
          animate={{ y: "0%" }}
          exit={{ y: dir > 0 ? "-115%" : "115%" }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function SectionRail() {
  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();
  const narrow = useNarrowViewport();
  // 좁은 화면이거나 터치 기기면 세로 레일 대신 상단 2px 진행 바만 남긴다.
  const barOnly = coarse || narrow;

  const progress = useMotionValue(0);
  const [chapter, setChapter] = useState<{ i: number; dir: number }>({ i: -1, dir: 1 }); // -1 = 히어로
  const [heroIn, setHeroIn] = useState(true);
  // 각 섹션이 "활성이 되는 순간"의 페이지 진행도. 측정 전에는 균등 배치로 버틴다.
  const [stops, setStops] = useState<number[]>(() => SECTIONS.map((_, i) => (i + 0.5) / SECTIONS.length));

  /* 현재 섹션 판정: 스크롤 계산이 아니라 뷰포트 한가운데에 걸친 밴드를 보는 IntersectionObserver.
     경계에서 두 섹션이 함께 걸리면 밴드 중심을 품은 쪽(= 화면 가운데를 차지한 쪽)을 고른다. */
  useEffect(() => {
    if (barOnly) return;

    const io = new IntersectionObserver(
      (entries) => {
        let best = -2; // -2 = 이번 콜백에는 판정 재료가 없음
        let bestScore = Infinity;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = e.target.id === HERO_ID ? -1 : SECTIONS.findIndex((s) => s.id === e.target.id);
          if (idx < -1) continue;
          const rb = e.rootBounds;
          const center = rb ? (rb.top + rb.bottom) / 2 : 0;
          const r = e.boundingClientRect;
          const score = Math.max(0, r.top - center, center - r.bottom); // 중심을 품으면 0
          if (score < bestScore || (score === bestScore && idx > best)) {
            bestScore = score;
            best = idx;
          }
        }
        if (best === -2) return; // 섹션 사이 빈 구간이면 직전 장을 유지한다
        setChapter((prev) => (prev.i === best ? prev : { i: best, dir: best > prev.i ? 1 : -1 }));
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );

    const hero = document.getElementById(HERO_ID);
    if (hero) io.observe(hero);
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }

    // 히어로가 화면에 조금이라도 남아 있는 동안은 레일을 띄우지 않는다(첫인상과 경쟁 금지).
    const heroIo = new IntersectionObserver(([e]) => setHeroIn(e.isIntersecting), { threshold: 0 });
    let raf = 0;
    if (hero) heroIo.observe(hero);
    else raf = requestAnimationFrame(() => setHeroIn(false)); // 히어로가 없는 페이지면 그냥 보여 준다

    return () => {
      io.disconnect();
      heroIo.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [barOnly]);

  /* 페이지 진행도와 눈금 위치. 상태 대신 모션값에 써서 스크롤마다 리렌더가 나지 않게 한다.
     상시 rAF 루프는 없다. 스크롤/리사이즈 이벤트당 프레임 한 번만 쓴다. */
  useEffect(() => {
    let raf = 0;
    let max = 1;

    const write = () => {
      raf = 0;
      progress.set(Math.min(1, Math.max(0, window.scrollY / max)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(write);
    };
    const measure = () => {
      const vh = window.innerHeight;
      max = Math.max(1, document.documentElement.scrollHeight - vh);
      // 섹션이 화면 한가운데에 닿는 스크롤 지점 = 그 눈금이 켜지는 진행도. 채움과 눈금이 같은 순간에 만난다.
      const next = SECTIONS.map((s, i) => {
        const el = document.getElementById(s.id);
        if (!el) return (i + 0.5) / SECTIONS.length;
        const top = el.getBoundingClientRect().top + window.scrollY;
        return Math.min(1, Math.max(0, (top - vh / 2) / max));
      });
      setStops((prev) => (prev.every((v, i) => Math.abs(v - next[i]) < 0.002) ? prev : next));
      write();
    };

    // 이미지 로드나 섹션 추가로 문서가 길어지면 다시 재고, 같은 값이면 상태를 갱신하지 않아 루프가 돌지 않는다.
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    ro.observe(document.documentElement);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    const first = requestAnimationFrame(measure);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      ro.disconnect();
      cancelAnimationFrame(first);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [progress]);

  // 모바일 대체물: 남은 양이라는 정보는 그대로 전하되 세로 레일은 그리지 않는다.
  if (barOnly) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[2px]">
        <motion.div className="h-full w-full origin-left bg-accent" style={{ scaleX: progress }} />
      </div>
    );
  }

  const idx = Math.max(0, chapter.i);
  const num = String(idx + 1).padStart(2, "0");
  const label = SECTIONS[idx].label;
  const visible = !heroIn;

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          key="rail"
          aria-label="섹션 이동"
          className="fixed top-1/2 z-30 flex items-center gap-[5px]"
          style={{ left: "max(6px, calc((100vw - 1400px) / 2))" }}
          initial={{ opacity: 0, x: reduced ? 0 : -10, y: "-50%" }}
          animate={{ opacity: 1, x: 0, y: "-50%" }}
          exit={{ opacity: 0, x: reduced ? 0 : -10, y: "-50%" }}
          transition={{ duration: reduced ? 0 : 0.6, ease: EASE }}
        >
          {/* 장 번호 + 세로 섹션 이름. 링크의 aria-label이 같은 정보를 읽어 주므로 장식으로 둔다.
              pointer-events-none 이라 위를 지나는 눈금 클릭 영역을 가리지 않는다. */}
          <div aria-hidden className="pointer-events-none flex w-[16px] flex-col items-center">
            <span className="display flex text-[11px] text-fg">
              <Digit char={num[0]} dir={chapter.dir} roll={!reduced} />
              <Digit char={num[1]} dir={chapter.dir} roll={!reduced} />
            </span>
            <span className="my-2 h-3 w-px bg-line" />
            <span className="relative flex h-[84px] w-full items-center justify-center">
              {reduced ? (
                /* .display은 레이어 밖 CSS라 tracking-* 유틸리티를 이긴다. 자간은 인라인으로 준다. */
                <span
                  className="display text-[11px] text-muted [text-orientation:upright] [writing-mode:vertical-rl]"
                  style={{ letterSpacing: "0.12em" }}
                >
                  {label}
                </span>
              ) : (
                <AnimatePresence initial={false}>
                  <motion.span
                    key={label}
                    className="display absolute text-[11px] text-muted [text-orientation:upright] [writing-mode:vertical-rl]"
                    style={{ letterSpacing: "0.12em" }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    {label}
                  </motion.span>
                </AnimatePresence>
              )}
            </span>
          </div>

          {/* 헤어라인 트랙 + 앰버 채움 + 섹션 눈금 */}
          <div className="relative w-px" style={{ height: TRACK_H }}>
            <span aria-hidden className="absolute inset-0 bg-line" />
            <motion.span
              aria-hidden
              className="absolute inset-x-0 top-0 h-full origin-top bg-accent"
              style={{ scaleY: progress }}
            />
            {SECTIONS.map((s, i) => {
              const passed = i <= idx;
              const active = i === idx;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  data-hover
                  aria-label={`${s.label} 섹션으로 이동`}
                  aria-current={active ? "true" : undefined}
                  onClick={(e) => {
                    const el = document.getElementById(s.id);
                    if (!el) return; // 대상이 없으면 브라우저 기본 앵커 동작에 맡긴다
                    e.preventDefault();
                    scrollToSection(el);
                  }}
                  className="absolute -translate-y-1/2"
                  style={{ top: `${stops[i] * 100}%`, left: -8, width: 22, height: 22 }}
                >
                  <span
                    aria-hidden
                    className="absolute top-1/2 block h-px -translate-y-1/2"
                    style={{
                      left: 8,
                      width: active ? 11 : passed ? 7 : 4,
                      background: passed ? "var(--accent)" : "var(--muted)",
                      opacity: passed ? 1 : 0.45,
                      transition: reduced ? "none" : "width 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.5s ease",
                    }}
                  />
                </a>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
