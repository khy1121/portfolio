/* /showcase 전용 데이터: 숫자 띠와 ⌘K 한 장 요약. 값은 이력서·저장소에서 확인된 것만 둔다. */
type L = { ko: string; en: string };

export const ticker: { value: string; label: L }[] = [
  { value: "5", label: { ko: "소개하는 프로젝트", en: "featured projects" } },
  { value: "25", label: { ko: "상담 예약 사용자", en: "reservation users" } },
  { value: "409", label: { ko: "예약 중복 요청 응답", en: "reservation conflict response" } },
  { value: "368", label: { ko: "팀 CI 테스트 · 26.08.20", en: "team CI tests · 26-08-20" } },
  { value: "99.8%", label: { ko: "NADOK 배너 용량 감소", en: "NADOK banner size cut" } },
  { value: "5", label: { ko: "Overlap으로 확정한 회의", en: "meetings settled with Overlap" } },
  { value: "48", label: { ko: "Cropy 병합 PR", en: "Cropy pull requests merged" } },
];

export const profile = {
  name: "김헌영",
  role: "프론트엔드 개발자",
  school: "한성대학교 컴퓨터공학부 웹공학트랙",
  graduation: "2027.02 졸업예정",
  gpa: "전공 평점 3.94 / 4.5",
  honor: "3-2 단과대 최우수 장학금",
  email: "rlagjsdud3@gmail.com",
  github: "https://github.com/khy1121",
  resume: "/resume.pdf",
  looking: "인턴 · 전환형 인턴 · 신입",
  certs: ["정보처리기사 필기 합격", "SQLD"],
  highlights: [
    { k: "소개하는 프로젝트", v: "5개" },
    { k: "상담 예약 사용자", v: "교수 3 · 학생 22" },
    { k: "예약 중복 요청 응답", v: "HTTP 409" },
    { k: "MCM 인증 상태", v: "3가지" },
    { k: "2026.08.20 팀 CI 테스트", v: "368개 통과" },
    { k: "NADOK 배너 용량", v: "8.79MB → 16KB" },
  ],
  principles: [
    "내가 먼저 쓰는 제품을 만든다",
    "무엇을 만들지 않을지를 더 오래 고민한다",
    "초안은 도구, 판단은 사람, 게이트는 CI",
  ],
} as const;
