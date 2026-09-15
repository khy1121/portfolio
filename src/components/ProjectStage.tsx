"use client";

import Image from "next/image";
import { motion, type MotionValue, useTransform } from "framer-motion";
import type { Project } from "@/lib/content";

/* 프로젝트 성격을 한눈에 보여 주는 모티프. 각 프로젝트의 핵심 동작을 선으로 그렸다. */
function Motif({ slug, color }: { slug: string; color: string }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (slug) {
    case "bookswap": // 두 권의 책이 자리를 바꾼다
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <motion.g animate={{ x: [0, 18, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <rect x="8" y="20" width="14" height="24" rx="2" {...common} />
            <line x1="12" y1="26" x2="18" y2="26" {...common} />
          </motion.g>
          <motion.g animate={{ x: [0, -18, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <rect x="42" y="20" width="14" height="24" rx="2" {...common} />
            <line x1="46" y1="26" x2="52" y2="26" {...common} />
          </motion.g>
          <path d="M26 14 h12 m-3 -3 l3 3 -3 3" {...common} />
          <path d="M38 50 h-12 m3 -3 l-3 3 3 3" {...common} />
        </svg>
      );
    case "omfres": // 시간표 슬롯 하나가 채워진다
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <rect x="8" y="12" width="48" height="42" rx="4" {...common} />
          <line x1="8" y1="22" x2="56" y2="22" {...common} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3].map((c) => (
              <rect key={`${r}${c}`} x={13 + c * 11} y={27 + r * 8.5} width="8" height="6" rx="1" {...common} strokeWidth={1} opacity={0.5} />
            )),
          )}
          <motion.rect
            x="35" y="35.5" width="8" height="6" rx="1" fill={color}
            animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
          />
        </svg>
      );
    case "boardingpass": // 탑승권에 스탬프가 찍힌다
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <path d="M8 18 h48 v10 a4 4 0 0 0 0 8 v10 h-48 v-10 a4 4 0 0 0 0 -8 z" {...common} />
          <line x1="40" y1="18" x2="40" y2="46" strokeDasharray="3 3" {...common} strokeWidth={1.2} />
          <line x1="14" y1="28" x2="30" y2="28" {...common} strokeWidth={1.2} />
          <line x1="14" y1="35" x2="26" y2="35" {...common} strokeWidth={1.2} />
          <motion.circle
            cx="48" cy="32" r="6" {...common}
            animate={{ scale: [1.6, 1, 1, 1.6], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.25, 0.8, 1] }}
            style={{ transformOrigin: "48px 32px" }}
          />
        </svg>
      );
    case "nadok": // 펼친 책 위로 감정이 떠오른다
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <path d="M10 44 c8 -4 14 -4 22 0 c8 -4 14 -4 22 0 v-24 c-8 -4 -14 -4 -22 0 c-8 -4 -14 -4 -22 0 z" {...common} />
          <line x1="32" y1="20" x2="32" y2="44" {...common} strokeWidth={1.2} />
          <motion.g animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <circle cx="32" cy="12" r="5" {...common} />
            <path d="M29.5 12.5 q2.5 2.5 5 0" {...common} strokeWidth={1.2} />
          </motion.g>
        </svg>
      );
    case "cropy": // 잎 위로 스캔선이 지나간다
      return (
        <svg viewBox="0 0 64 64" className="h-full w-full">
          <path d="M14 50 C14 26 30 14 52 12 C52 36 38 50 14 50 z" {...common} />
          <path d="M14 50 C24 40 34 30 46 18" {...common} strokeWidth={1.2} />
          <motion.line x1="10" x2="56" y1="30" y2="30" stroke={color} strokeWidth={1.5}
            animate={{ y: [-18, 20, -18] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        </svg>
      );
    default:
      return null;
  }
}

/* Cropy는 배포 화면이 없어 실제 진단 로직(접전이면 재촬영 유도)을 위젯으로 보여 준다 */
function CropyWidget({ color }: { color: string }) {
  const rows = [
    { name: "무 노균병", v: 46 },
    { name: "무 검은무늬병", v: 41 },
    { name: "정상", v: 9 },
  ];
  return (
    <div className="w-full rounded-2xl border border-line bg-bg/70 p-5 backdrop-blur">
      <div className="text-xs text-muted">진단 결과 · 신뢰도</div>
      <ul className="mt-3 space-y-3">
        {rows.map((r, i) => (
          <li key={r.name}>
            <div className="flex justify-between text-sm">
              <span>{r.name}</span>
              <span className="font-display tabular-nums">{r.v}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: i < 2 ? color : "var(--muted)" }}
                initial={{ width: 0 }}
                whileInView={{ width: `${r.v}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-xl px-3 py-2.5 text-sm" style={{ backgroundColor: `${color}22`, color }}>
        두 결과의 차이가 0.20 미만이라 판별 부위를 한 장 더 찍어 주세요.
      </div>
    </div>
  );
}

export function ProjectStage({ p, tiltX, tiltY }: { p: Project; tiltX: MotionValue<number>; tiltY: MotionValue<number> }) {
  // the phone floats a little against the card's tilt
  const px = useTransform(tiltY, (v) => v * -2.2);
  const py = useTransform(tiltX, (v) => v * 2.2);
  return (
    <div
      className="relative flex min-h-[320px] items-end justify-center overflow-hidden rounded-2xl md:min-h-0"
      style={{ background: `linear-gradient(160deg, ${p.accent}2e, ${p.accent}08 60%, transparent)` }}
    >
      <div className="absolute left-5 top-5 h-14 w-14 md:h-16 md:w-16" aria-hidden>
        <Motif slug={p.slug} color={p.accent} />
      </div>

      {p.shot ? (
        <motion.div
          style={{ x: px, y: py }}
          className="relative mt-16 w-[62%] max-w-[250px] translate-y-6 md:mt-20"
        >
          <div className="overflow-hidden rounded-[26px] border-[6px] border-[#0b0f12] bg-[#0b0f12] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
            <Image
              src={p.shot}
              alt={`${p.title} 실제 화면`}
              width={540}
              height={1130}
              sizes="(max-width: 768px) 60vw, 250px"
              className="block h-auto w-full"
            />
          </div>
        </motion.div>
      ) : (
        <motion.div style={{ x: px, y: py }} className="relative w-[88%] max-w-[300px] pb-6 pt-24">
          <CropyWidget color={p.accent} />
        </motion.div>
      )}
    </div>
  );
}
