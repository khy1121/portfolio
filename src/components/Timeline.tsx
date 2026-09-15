"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";

const events: { when: string; title: string; detail: string; tag?: string }[] = [
  { when: "2021.03", title: "한성대학교 컴퓨터공학부 입학", detail: "웹공학트랙. 2027.02 졸업예정" },
  { when: "2025.10 – 12", title: "CSTIME 학습 지원 서비스 · Java 멀티플레이 FPS", detail: "팀 4인 커밋 57/79. 무거운 백엔드 1,590줄을 지우고 localStorage로 전환. TCP 소켓 4인 게임 서버를 혼자 만들고 3,886줄 클래스를 3,107줄로 리팩토링", tag: "팀 · 개인" },
  { when: "2025.12 – 2026.06", title: "LookMate 가상 피팅", detail: "Express+Prisma 백엔드를 Spring Boot+JPA로 재작성, GitHub Actions CI", tag: "개인" },
  { when: "2026.03 – 07", title: "멋쟁이사자처럼 14기 프론트엔드", detail: "React·TypeScript 교육, 팀 저장소 커밋 약 65%", tag: "교육" },
  { when: "2026.04 – 06", title: "시험 대비 퀴즈 PWA 3종", detail: "80 → 204 → 390문항. 매일 쓴 도구로 학기 평점 3.5 → 4.5", tag: "개인" },
  { when: "2026.05 – 08", title: "NADOK 독서 기록·감정 분석", detail: "FE 커밋 129/135. Mixed Content를 프록시로 풀고 코드 단에서 재발 차단", tag: "팀" },
  { when: "2026.08", title: "MCM Boarding Pass 해커톤 · FE 총괄", detail: "팀 6인, 커밋 75%. API 31개 중 30개 연동, 368개 테스트", tag: "해커톤" },
  { when: "2026.08", title: "bookSwap 교재 거래 PWA", detail: "이틀 46커밋. 2,031행 카탈로그, Supabase RLS·Realtime, Lighthouse 91/96", tag: "개인" },
  { when: "2026.09", title: "상담 예약 사이트 실운영 · CropCare AI 팀장 · 정보처리기사 필기 · SQLD", detail: "교수 3인·학생 22명 사용. ResNet50 파인튜닝 테스트 93.1%", tag: "운영 · 팀 · 자격" },
  { when: "2027.02", title: "졸업 예정", detail: "그 전까지 인턴·전환형 인턴으로 실서비스 지표를 다루는 팀에서 일하는 것이 목표", tag: "다음" },
];

export function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const fill = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), { stiffness: 80, damping: 24 });

  return (
    <section id="timeline" className="rule mx-auto max-w-[1400px] px-5 py-28 md:px-10 md:py-40">
      <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className="display text-[clamp(2.6rem,6.5vw,5.5rem)]">지나온 길</h2>
        <p className="max-w-[36ch] text-muted md:text-lg">시험공부 도구에서 시작해 실운영 서비스까지. 순서대로.</p>
      </div>
      <div ref={ref} className="relative pl-8 md:pl-0">
        {/* 세로 선: 스크롤에 맞춰 강조색으로 채워진다 */}
        <div className="absolute bottom-0 left-2 top-0 w-px bg-line md:left-1/2" />
        <motion.div className="absolute left-2 top-0 w-px origin-top bg-accent md:left-1/2" style={{ scaleY: fill, height: "100%" }} />
        <ol className="space-y-10 md:space-y-14">
          {events.map((ev, i) => {
            const left = i % 2 === 0;
            return (
              <li key={ev.when + ev.title} className={`relative md:grid md:grid-cols-2 md:gap-16 ${left ? "" : ""}`}>
                <span className="absolute -left-[27px] top-2 h-3 w-3 rounded-full border-2 border-accent bg-bg md:left-1/2 md:-ml-1.5" />
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-15% 0px" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className={`${left ? "md:col-start-1 md:pr-10 md:text-right" : "md:col-start-2 md:pl-10"}`}
                >
                  <div className="flex items-center gap-3 text-sm text-muted md:justify-start" style={{ justifyContent: left ? undefined : undefined }}>
                    <span className="font-display font-semibold tabular-nums text-accent">{ev.when}</span>
                    {ev.tag && <span className="rounded-full border border-line px-2 py-0.5 text-xs">{ev.tag}</span>}
                  </div>
                  <h3 className="mt-2 text-lg font-bold md:text-xl">{ev.title}</h3>
                  <p className="mt-1 max-w-[52ch] leading-relaxed text-muted">{ev.detail}</p>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
