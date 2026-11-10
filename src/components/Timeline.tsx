/* 이력서에 있는 항목만, 최근 순으로 */
const events: { when: string; title: string; detail: string }[] = [
  { when: "2026.11", title: "Overlap 회의 일정 조율 웹앱", detail: "각자 되는 시간을 칠하면 겹치는 시간을 추천. 약 10명이 사용해 회의 5회 확정" },
  { when: "2026.09 –", title: "CropCare AI 산학협력 프로젝트 팀장", detail: "팀 5인에서 기획·디자인·백엔드·모델 담당" },
  { when: "2026.09", title: "상담 예약 서비스 · SQLD 취득", detail: "교수 3인·학생 22명이 쓰는 예약 사이트를 만들어 운영. 정보처리기사 필기 합격" },
  { when: "2026.08", title: "MCM Boarding Pass 해커톤", detail: "가입 상태 복원·API 통합·회귀테스트 기여. 팀 CI에서 테스트 368개 통과" },
  { when: "2026.05 – 08", title: "NADOK 독서 기록·감정 분석", detail: "멋쟁이사자처럼 교내 해커톤 대상. 8.79MB SVG 배너를 16KB WebP로 교체" },
  { when: "2026.03 –", title: "멋쟁이사자처럼 14기 프론트엔드", detail: "React 교육 과정 수료, 해커톤 참여" },
  { when: "2021.03", title: "한성대학교 컴퓨터공학부 입학", detail: "웹공학트랙 · 2027.02 졸업예정 · 3학년 2학기 단과대 최우수 장학금" },
];

export function Timeline() {
  return (
    <section id="timeline" className="rule mx-auto max-w-[1100px] scroll-mt-16 px-5 py-20 md:px-8 md:py-28">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr] md:gap-16">
        <h2 className="display text-[clamp(2rem,4.5vw,3.2rem)]">지나온 길</h2>
        <ol className="space-y-6 border-l border-line pl-6">
          {events.map((ev) => (
            <li key={ev.when + ev.title} className="relative">
              <span className="absolute -left-[29px] top-2 h-2 w-2 rounded-full bg-accent" aria-hidden />
              <div className="font-display text-sm font-semibold tabular-nums text-accent">{ev.when}</div>
              <h3 className="mt-1 font-bold md:text-lg">{ev.title}</h3>
              <p className="mt-1 leading-relaxed text-muted">{ev.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
