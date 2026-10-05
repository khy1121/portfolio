export type Lang = "ko" | "en";

type L = { ko: string; en: string };

export type Project = {
  slug: string;
  title: string;
  kind: string;
  shot?: string;
  period: string;
  role: L;
  summary: L;
  problem: L;
  result: L;
  stats: { value: string; label: L }[];
  stack: string[];
  repo: string;
  demo?: string;
  accent: string;
};

export const projects: Project[] = [
  {
    slug: "bookswap",
    title: "bookSwap",
    kind: "교내 중고 교재 거래",
    shot: "/shots/bookswap.webp",
    period: "2026.08",
    role: { ko: "개인 · 46커밋 · 이틀 배포", en: "Solo · 46 commits · shipped in 2 days" },
    summary: {
      ko: "과목·교수 기준으로 교재를 찾고 1:1 채팅으로 거래하는 교내 PWA",
      en: "Campus textbook-swap PWA searchable by course and professor, with 1:1 chat",
    },
    problem: {
      ko: "장터 글 40건 중 72%가 교재 거래인데 과목 기준 검색이 없었다.",
      en: "72% of 40 marketplace posts were textbooks, yet none were searchable by course.",
    },
    result: {
      ko: "수업계획서를 크롤링해 2,031행 카탈로그를 만들고 Supabase RLS·Realtime으로 이틀 만에 배포. 직렬 조회 3개를 1회로 줄여 Lighthouse 91/96.",
      en: "Crawled syllabi into a 2,031-row catalog and shipped on Supabase RLS + Realtime in two days. Cut 3 serial queries to 1, Lighthouse 91/96.",
    },
    stats: [
      { value: "2,031", label: { ko: "행 카탈로그", en: "catalog rows" } },
      { value: "96", label: { ko: "Lighthouse 모바일", en: "Lighthouse mobile" } },
    ],
    stack: ["Next.js 16", "Supabase", "Python", "GitHub Actions"],
    repo: "https://github.com/khy1121/bookSwap",
    demo: "https://book-swap-virid.vercel.app",
    accent: "#F2B544",
  },
  {
    slug: "omfres",
    title: "상담 예약",
    kind: "교수 상담 예약 시스템",
    shot: "/shots/omfres.webp",
    period: "2026.09",
    role: { ko: "예약·관리자 화면 및 API 개발", en: "Reservation and admin UI · API development" },
    summary: {
      ko: "교수별 상담 규칙에 따라 예약 가능한 시간을 만들고 관리자 화면에서 일정을 관리하는 서비스",
      en: "A reservation service that generates slots from each professor's rules and manages schedules in an admin UI",
    },
    problem: {
      ko: "같은 상담 슬롯에 요청이 겹칠 때 중복 요청을 구분해 처리해야 했다.",
      en: "Concurrent requests for the same office-hour slot needed explicit conflict handling.",
    },
    result: {
      ko: "교수·날짜·시간 키를 Redis SET NX로 선점하고 중복 요청에 HTTP 409를 반환. 관리자 화면에 예약 조회·추가·이동·삭제, 캘린더와 CSV 내보내기를 구현.",
      en: "Claimed professor/date/time keys with Redis SET NX and returned HTTP 409 for conflicts. Built reservation management, a calendar and CSV export.",
    },
    stats: [
      { value: "409", label: { ko: "중복 요청 응답", en: "conflict response" } },
      { value: "SET NX", label: { ko: "예약 슬롯 선점", en: "slot claim" } },
    ],
    stack: ["Next.js 16", "TypeScript", "Upstash Redis"],
    repo: "https://github.com/khy1121/omfres",
    demo: "https://onlyonereservation.vercel.app",
    accent: "#7FD1B9",
  },
  {
    slug: "boardingpass",
    title: "MCM Boarding Pass",
    kind: "패션 브랜드 매장 체험 웹",
    shot: "/shots/boardingpass.webp",
    period: "2026.08",
    role: { ko: "해커톤 · 팀 프론트엔드 · 인증·API·회귀테스트 기여", en: "Hackathon · team frontend · auth, APIs and regression tests" },
    summary: {
      ko: "매장 방문을 비행에 비유한 모바일 웹. 회원가입(여권) → 설문 → AI 추천 동선 → 3D 여권 스탬프",
      en: "Mobile web that frames a store visit as a flight: passport sign-up, survey, AI route, 3D passport stamp",
    },
    problem: {
      ko: "카카오 가입 중 이탈한 사용자가 돌아오면 보호 화면이 빈 데이터로 깨졌다.",
      en: "Users who dropped mid-signup came back to broken, empty protected screens.",
    },
    result: {
      ko: "ProtectedRoute로 미인증·프로필 미완성·가입 완료를 구분하고 세션 복원과 API 회귀테스트에 기여. 2026.08.20 팀 CI에서 테스트 368개와 빌드 통과.",
      en: "Separated signed-out, incomplete-profile and completed states in ProtectedRoute, with session recovery and API regression tests. On 2026-08-20, team CI passed 368 tests and the build.",
    },
    stats: [
      { value: "368", label: { ko: "팀 CI 테스트 · 26.08.20", en: "team CI tests · 26-08-20" } },
      { value: "3", label: { ko: "인증 상태 구분", en: "authentication states" } },
    ],
    stack: ["React 19", "React Router 7", "three.js", "Vitest"],
    repo: "https://github.com/Hsu-Likelion-14th-Hackathon/FE",
    demo: "https://boardingpass-seven.vercel.app",
    accent: "#F28C6B",
  },
  {
    slug: "nadok",
    title: "NADOK",
    kind: "독서 기록 · 감정 분석",
    shot: "/shots/nadok.webp",
    period: "2026.05 – 08",
    role: { ko: "팀 프론트엔드 · API·세션·모바일 대응", en: "Team frontend · APIs, sessions and mobile UI" },
    summary: {
      ko: "독서 기록과 감정 분석 서비스의 프론트엔드",
      en: "Frontend for a reading-journal and mood-analysis service",
    },
    problem: {
      ko: "HTTPS 배포에서 HTTP 백엔드 호출이 Mixed Content로 전부 막혔다.",
      en: "On HTTPS every call to the HTTP backend was blocked as mixed content.",
    },
    result: {
      ko: "Vercel Functions의 동일 출처 프록시와 이미지 URL 정규화를 적용. 회원정보·세션 검사를 공통화하고 모바일 키보드 대응과 PWA 업데이트 안내를 추가.",
      en: "Added a same-origin Vercel Functions proxy and image URL normalization, shared profile/session checks, mobile keyboard handling and PWA update prompts.",
    },
    stats: [
      { value: "API", label: { ko: "동일 출처 프록시", en: "same-origin proxy" } },
      { value: "PWA", label: { ko: "업데이트 안내", en: "update prompts" } },
    ],
    stack: ["React 18", "Vite", "Tiptap", "PWA"],
    repo: "https://github.com/khy1121/bugitone",
    demo: "https://bugitone.vercel.app",
    accent: "#B49CF0",
  },
  {
    slug: "cropy",
    title: "CropCare AI",
    kind: "농작물 병해충 AI 진단",
    period: "2026.09 –",
    role: { ko: "팀 5인 · PM·모델 담당 · 초기 웹앱 구현", en: "Team of 5 · PM and model work · initial web app" },
    summary: {
      ko: "사진 한 장으로 농작물 병해충을 진단하고 농약을 추천하는 플랫폼",
      en: "Diagnose crop disease from a photo and recommend treatment",
    },
    problem: {
      ko: "두 병해의 신뢰도가 접전일 때 단일 결과만 보여 주면 잘못된 농약을 고를 수 있다.",
      en: "When two diseases score neck and neck, a single answer can pick the wrong pesticide.",
    },
    result: {
      ko: "사진 업로드·결과·재촬영·이력 조회를 FastAPI와 연결. ResNet 기반 병해·정상 9개 클래스의 학습·평가 코드를 구현하고 요구사항과 API·DB 명세 초안을 정리.",
      en: "Connected photo upload, results, retakes and history to FastAPI. Implemented ResNet training and evaluation for 9 classes, and drafted requirements and API/database specifications.",
    },
    stats: [
      { value: "9", label: { ko: "분류 클래스", en: "classification classes" } },
      { value: "ResNet", label: { ko: "학습·평가 구현", en: "training and evaluation" } },
    ],
    stack: ["Next.js 15", "FastAPI", "PyTorch"],
    repo: "https://github.com/khy1121/Cropy",
    accent: "#9CD36A",
  },
];

export const ticker: { value: string; label: L }[] = [
  { value: "5", label: { ko: "소개하는 프로젝트", en: "featured projects" } },
  { value: "409", label: { ko: "예약 중복 요청 응답", en: "reservation conflict response" } },
  { value: "368", label: { ko: "팀 CI 테스트 · 26.08.20", en: "team CI tests · 26-08-20" } },
  { value: "2,031", label: { ko: "크롤링한 데이터 행", en: "rows crawled" } },
  { value: "96", label: { ko: "Lighthouse 모바일", en: "Lighthouse mobile" } },
  { value: "3", label: { ko: "MCM 인증 상태", en: "MCM authentication states" } },
  { value: "9", label: { ko: "Cropy 분류 클래스", en: "Cropy classification classes" } },
];

export const copy = {
  ko: {
    nav: { work: "프로젝트", about: "소개", contact: "연락" },
    hero: {
      role: "Frontend Engineer",
      line1: "내가 먼저 쓰는 제품을 만들고,",
      line2: "왜 그렇게 만들었는지 설명할 수 있는 코드를 짭니다.",
      cta1: "프로젝트 보기",
      cta2: "이력서 PDF",
      hint: "스크롤",
    },
    work: {
      title: "만든 것",
      lead: "문제를 어떻게 찾았고, 무엇을 골랐고, 숫자로 무엇이 남았는지.",
      problem: "문제",
      result: "결과",
      repo: "코드",
      demo: "배포",
    },
    about: {
      title: "일하는 방식",
      p1: "시험공부가 막혀서 퀴즈 앱을 만들었고, 매일 쓰면서 80문항에서 390문항까지 키웠습니다. 그 학기 평점이 3.5에서 4.5로 올랐습니다. 내가 먼저 쓰는 제품이 가장 빠른 피드백이라는 걸 그때 배웠습니다.",
      p2: "기능을 더하는 것보다 안 만드는 결정을 더 오래 고민합니다. 해커톤에서 계획했던 라이브러리 4종을 끝까지 넣지 않았고, 팀 프로젝트에서는 무거운 백엔드 1,590줄을 지웠습니다. 이유는 항상 문서로 남깁니다.",
      p3: "코딩 에이전트를 매일 씁니다. 초안은 도구가, 판단은 제가, 게이트는 CI가 맡습니다. 왜 이렇게 짰는지 설명할 수 없는 코드는 커밋하지 않습니다.",
      stackTitle: "다루는 것",
      edu: "한성대학교 컴퓨터공학부 웹공학트랙 · 2027.02 졸업예정 · 전공 평점 3.94",
    },
    contact: {
      title: "같이 만들 것이 있다면",
      email: "rlagjsdud3@gmail.com",
      copy: "이메일 복사",
      copied: "복사됨",
      github: "GitHub",
      resume: "이력서",
      built: "이 사이트는 Next.js, React Three Fiber, Framer Motion으로 만들었습니다.",
    },
  },
  en: {
    nav: { work: "Work", about: "About", contact: "Contact" },
    hero: {
      role: "Frontend Engineer",
      line1: "I build products I use first,",
      line2: "and write code I can explain.",
      cta1: "See the work",
      cta2: "Résumé PDF",
      hint: "Scroll",
    },
    work: {
      title: "Work",
      lead: "How I found the problem, what I chose, and what the numbers say.",
      problem: "Problem",
      result: "Result",
      repo: "Code",
      demo: "Live",
    },
    about: {
      title: "How I work",
      p1: "Stuck studying for exams, I built a quiz app and grew it from 80 to 390 questions by using it every day. My GPA went from 3.5 to 4.5 that semester. That is where I learned a product you use yourself is the fastest feedback loop.",
      p2: "I spend longer deciding what not to build. I kept four planned libraries out of a hackathon app and deleted 1,590 lines of backend from a team project. The reasons always end up in a doc.",
      p3: "I use coding agents daily. The tool drafts, I decide, CI gates. Code I cannot explain does not get committed.",
      stackTitle: "Tools",
      edu: "Hansung University, Computer Engineering (Web track) · graduating Feb 2027 · major GPA 3.94",
    },
    contact: {
      title: "If there is something to build together",
      email: "rlagjsdud3@gmail.com",
      copy: "Copy email",
      copied: "Copied",
      github: "GitHub",
      resume: "Résumé",
      built: "Built with Next.js, React Three Fiber and Framer Motion.",
    },
  },
} as const;

export const stack = [
  "TypeScript",
  "React 19",
  "Next.js 16",
  "Tailwind CSS 4",
  "Framer Motion",
  "three.js / R3F",
  "Vitest",
  "Supabase",
  "Upstash Redis",
  "Vercel",
  "GitHub Actions",
  "Claude Code",
];

/* ⌘K 한 장 요약·주석 모드가 쓰는 프로필 데이터.
   전부 이력서·저장소에서 확인된 값만 둔다. */
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
    { k: "예약 중복 요청 응답", v: "HTTP 409" },
    { k: "MCM 인증 상태", v: "3가지" },
    { k: "2026.08.20 팀 CI 테스트", v: "368개 통과" },
    { k: "크롤링 카탈로그", v: "2,031행" },
    { k: "Lighthouse", v: "데스크톱 91 · 모바일 96" },
  ],
  principles: [
    "내가 먼저 쓰는 제품을 만든다",
    "무엇을 만들지 않을지를 더 오래 고민한다",
    "초안은 도구, 판단은 사람, 게이트는 CI",
  ],
} as const;
