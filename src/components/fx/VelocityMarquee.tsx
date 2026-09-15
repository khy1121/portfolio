"use client";

import { useEffect, useRef, useState } from "react";
import { useSite } from "@/components/Providers";
import { ticker } from "@/lib/content";
import { useCoarsePointer, useInView, usePrefersReducedMotion } from "@/lib/useEnv";

/* 스크롤 속도에 반응하는 숫자 띠.
   CSS 키프레임 대신 rAF + transform으로 굴린다. 아래로 스크롤하면 빨라지고 위로 올리면 방향이 뒤집히며,
   띠 전체가 속도에 비례해 살짝 기울었다가 스프링으로 0도로 돌아온다. */

const BASE_SPEED = 38; // px/s, 가만히 있을 때의 표류 속도
const VEL_SCALE = 0.32; // 스크롤 속도(px/s) → 띠 속도 환산
const MAX_SPEED = 900; // px/s
const SKEW_PER_VEL = 6 / 1800; // 1800px/s에서 최대 기울기에 닿는다
const COUNT_MS = 900;

type Parsed = { prefix: string; suffix: string; value: number; decimals: number; grouped: boolean };

/* "2,031" · "75%" · "0" 같은 원본 문자열을 접두/숫자/접미로 쪼갠다.
   쉼표 유무와 소수 자릿수를 기억해야 카운트업 중에도 표기가 원본과 같아진다. */
function parseValue(raw: string): Parsed {
  const m = /^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/.exec(raw);
  if (!m) return { prefix: raw, suffix: "", value: 0, decimals: 0, grouped: false };
  const [, prefix, core, suffix] = m;
  const plain = core.replace(/,/g, "");
  const dot = plain.indexOf(".");
  return {
    prefix,
    suffix,
    value: Number(plain),
    decimals: dot === -1 ? 0 : plain.length - dot - 1,
    grouped: core.includes(","),
  };
}

function formatValue(p: Parsed, n: number) {
  const fixed = n.toFixed(p.decimals);
  const body = p.grouped
    ? Number(fixed).toLocaleString("en-US", { minimumFractionDigits: p.decimals, maximumFractionDigits: p.decimals })
    : fixed;
  return p.prefix + body + p.suffix;
}

export function VelocityMarquee() {
  const { lang } = useSite();
  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();

  const wrapRef = useRef<HTMLDivElement>(null);
  const skewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const periodRef = useRef(0); // 한 세트의 폭 = 모듈로 주기
  const offsetRef = useRef(0); // 화면 밖으로 나갔다 돌아와도 이어지도록 보관
  const startRef = useRef(0); // 카운트업 시작 시각
  const doneRef = useRef(false); // 카운트업은 한 번만

  const inView = useInView(wrapRef, "120px");
  const [copies, setCopies] = useState(2);
  const maxSkew = coarse ? 4 : 6; // 터치 기기에선 조금 얌전하게

  /* 세트 폭을 재고, 화면을 덮을 만큼 사본 수를 맞춘다.
     ResizeObserver 콜백은 비동기라 effect 본문 setState 금지 규칙에 걸리지 않는다. */
  useEffect(() => {
    if (reduced) return;
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const measure = () => {
      const first = track.firstElementChild as HTMLElement | null;
      if (!first) return;
      const w = first.getBoundingClientRect().width;
      if (w <= 0) return;
      periodRef.current = w;
      const need = Math.min(8, Math.max(2, Math.ceil(wrap.getBoundingClientRect().width / w) + 1));
      setCopies((c) => (c === need ? c : need));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(track);
    return () => ro.disconnect();
  }, [reduced]);

  /* 숫자 카운트업. SSR은 원본 값을 그대로 내보내고, 마운트 뒤 0으로 되돌렸다가 화면에 들어오면 한 번만 올린다.
     사본이 늘어 effect가 다시 돌아도 startRef 덕분에 타임라인이 이어진다. */
  useEffect(() => {
    if (reduced) return;
    const track = trackRef.current;
    if (!track) return;
    const nums = Array.from(track.querySelectorAll<HTMLElement>("[data-vm-num]")).map((el) => ({
      el,
      p: parseValue(el.dataset.vmNum ?? ""),
    }));
    const paint = (e: number) => {
      for (const n of nums) n.el.textContent = formatValue(n.p, n.p.value * e);
    };
    if (doneRef.current) {
      paint(1);
      return;
    }
    if (!inView) {
      paint(0);
      return;
    }
    if (startRef.current === 0) startRef.current = performance.now();
    const start = startRef.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_MS);
      paint(1 - Math.pow(1 - t, 3)); // ease-out cubic
      if (t < 1) raf = requestAnimationFrame(step);
      else doneRef.current = true;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced, inView, copies]);

  /* 표류 + 기울기 루프. 화면 안에 있을 때만 돈다. 프레임마다 읽기 1번(scrollY), 쓰기 2번. */
  useEffect(() => {
    if (reduced || !inView) return;
    const skewEl = skewRef.current;
    const track = trackRef.current;
    if (!skewEl || !track) return;

    let raf = 0;
    let last = performance.now();
    let lastY = window.scrollY;
    let vel = 0;
    let skew = 0;
    let skewV = 0;
    let gate = hoverRef.current ? 0 : 1; // 호버하면 0으로 수렴 = 정지
    let x = offsetRef.current;

    const loop = (now: number) => {
      const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
      last = now;

      const y = window.scrollY;
      const raw = (y - lastY) / dt;
      lastY = y;

      // 지수 평활: 프레임 간격이 흔들려도 반응 속도가 같다
      vel += (raw - vel) * (1 - Math.exp(-dt / 0.1));
      gate += ((hoverRef.current ? 0 : 1) - gate) * (1 - Math.exp(-dt / 0.12));

      const speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, BASE_SPEED + vel * VEL_SCALE)) * gate;
      x += speed * dt;
      const period = periodRef.current;
      if (period > 0) x = ((x % period) + period) % period; // 이음매 없이 순환
      offsetRef.current = x;

      // 스프링: 목표가 0이 되면 살짝 넘겼다가 제자리로 돌아온다
      const target = Math.max(-maxSkew, Math.min(maxSkew, vel * SKEW_PER_VEL));
      skewV += ((target - skew) * 170 - skewV * 24) * dt;
      skew += skewV * dt;

      track.style.transform = `translate3d(${-x}px,0,0)`;
      skewEl.style.transform = `skewX(${skew.toFixed(3)}deg)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      skewEl.style.transform = "skewX(0deg)";
    };
  }, [reduced, inView, maxSkew]);

  /* 모션 최소화: 흐르지도 기울지도 않는다. 넘치는 대신 여러 줄로 접힌다. */
  if (reduced) {
    return (
      <div className="rule border-b border-line px-5 py-5 md:px-7" role="group" aria-label="핵심 숫자">
        <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
          {ticker.map((it) => (
            <div key={it.label.en} className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-bold tabular-nums text-accent md:text-4xl">{it.value}</span>
              <span className="text-sm text-muted">{it.label[lang]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="rule overflow-hidden border-b border-line py-5"
      role="group"
      aria-label="핵심 숫자"
      onPointerEnter={(e) => {
        // 터치의 가짜 호버로는 멈추지 않는다
        if (e.pointerType === "mouse") hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
    >
      <div ref={skewRef} className="will-change-transform">
        {/* 항목마다 pr로 간격을 주어 한 세트의 폭이 곧 순환 주기가 되게 한다 */}
        <div ref={trackRef} className="flex w-max pl-5 will-change-transform md:pl-7">
          {Array.from({ length: copies }, (_, c) => (
            <div key={c} className="flex" aria-hidden={c > 0}>
              {ticker.map((it) => (
                <div key={it.label.en} className="group flex items-baseline gap-3 whitespace-nowrap pr-10 md:pr-14">
                  <span
                    data-vm-num={it.value}
                    // 카운트업으로 폭이 출렁이지 않게 최종 길이만큼 미리 잡아 둔다
                    style={{ minWidth: `${it.value.length}ch` }}
                    className="inline-block font-display text-3xl font-bold tabular-nums text-accent transition duration-300 ease-out group-hover:scale-105 group-hover:text-fg md:text-4xl"
                  >
                    {it.value}
                  </span>
                  <span className="text-sm text-muted transition-colors duration-300 group-hover:text-fg">
                    {it.label[lang]}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
