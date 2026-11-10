export type Lang = "ko" | "en";

type L = { ko: string; en: string };

export type Project = {
  slug: string;
  title: string;
  kind: string;
  shot?: string;
  thumb?: string; // 갤러리용 16:10 미리보기
  period: string;
  role: L;
  summary: L;
  problem: L;
  result: L;
  stats: { value: string; label: L }[];
  stack: string[];
  repo?: string;
  demo?: string;
  accent: string;
};

export const projects: Project[] = [
  {
    slug: "omfres",
    thumb: "/shots/thumbs/omfres.webp",
    title: "상담 예약",
    kind: "교수 상담 예약 시스템",
    shot: "/shots/omfres.webp",
    period: "2026.09",
    role: { ko: "개인 · 기획·개발·운영 · 교수 3인·학생 22명 사용", en: "Solo · built and operated · used by 3 professors and 22 students" },
    summary: {
      ko: "교수별 상담 규칙에 따라 예약 가능한 시간을 만들고 관리자 화면에서 일정을 관리하는 서비스",
      en: "A reservation service that generates slots from each professor's rules and manages schedules in an admin UI",
    },
    problem: {
      ko: "교수 3인이 학생 22명의 상담 시간을 한 명씩 물어 표로 만들었고, 같은 시간에 요청이 겹치면 구분해 처리해야 했다.",
      en: "Three professors built the schedule for 22 students by asking one at a time, and concurrent requests for a slot needed explicit conflict handling.",
    },
    result: {
      ko: "교수·날짜·시간 키를 Redis SET NX로 선점하고 중복 요청에 HTTP 409를 반환. 관리자 화면에 예약 조회·추가·이동·삭제, 캘린더와 CSV 내보내기를 구현. 결석했던 학생 3명도 주소만 받고 중복 없이 예약.",
      en: "Claimed professor/date/time keys with Redis SET NX and returned HTTP 409 for conflicts. Built reservation management, a calendar and CSV export. Three absent students booked without conflicts from the link alone.",
    },
    stats: [
      { value: "25", label: { ko: "사용자 · 교수 3 · 학생 22", en: "users · 3 professors, 22 students" } },
      { value: "409", label: { ko: "중복 요청 응답", en: "conflict response" } },
    ],
    stack: ["Next.js 16", "TypeScript", "Upstash Redis"],
    repo: "https://github.com/khy1121/omfres",
    demo: "https://onlyonereservation.vercel.app",
    accent: "#7FD1B9",
  },
  {
    slug: "overlap",
    thumb: "/shots/thumbs/overlap.webp",
    title: "Overlap",
    kind: "팀 회의 일정 조율",
    period: "2026.11",
    role: { ko: "개인 · 기획·개발·운영", en: "Solo · planning, development and operation" },
    summary: {
      ko: "각자 되는 시간을 칠하면 모두가 겹치는 시간을 찾아 제안하는 웹앱",
      en: "A web app that finds the time everyone shares once each person paints their availability",
    },
    problem: {
      ko: "해커톤 팀 회의를 잡을 때 일정을 등록하고도 서너 번 연락을 주고받아야 했다.",
      en: "Scheduling a hackathon team meeting still took three or four rounds of messages after entering availability.",
    },
    result: {
      ko: "초대된 약속에 일정을 한 번 입력하면 전원이 되는 시간과 추천 시간을 계산. Supabase Realtime으로 입력을 동기화하고 RLS로 본인 일정만 수정하게 제한. 약 10명이 사용해 회의 5회를 확정.",
      en: "One entry per person yields the shared and recommended slots. Supabase Realtime syncs input and RLS limits edits to your own schedule. About 10 people used it to settle 5 meetings.",
    },
    stats: [
      { value: "5", label: { ko: "확정한 회의", en: "meetings settled" } },
      { value: "10", label: { ko: "사용자(약)", en: "users (approx.)" } },
    ],
    stack: ["React 18", "Vite", "Supabase", "PWA"],
    demo: "https://overlap-liard.vercel.app",
    accent: "#F2B544",
  },
  {
    slug: "boardingpass",
    thumb: "/shots/thumbs/boardingpass.webp",
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
    thumb: "/shots/thumbs/nadok.webp",
    title: "NADOK",
    kind: "독서 기록 · 감정 분석",
    shot: "/shots/nadok.webp",
    period: "2026.05 – 08",
    role: { ko: "팀 프론트엔드 · 교내 해커톤 대상", en: "Team frontend · campus hackathon grand prize" },
    summary: {
      ko: "독서 기록과 감정 분석 서비스의 프론트엔드",
      en: "Frontend for a reading-journal and mood-analysis service",
    },
    problem: {
      ko: "HTTPS 배포에서 HTTP 백엔드 호출이 Mixed Content로 전부 막혔다.",
      en: "On HTTPS every call to the HTTP backend was blocked as mixed content.",
    },
    result: {
      ko: "Vercel Functions의 동일 출처 프록시와 이미지 URL 정규화를 적용. 회원정보·세션 검사를 공통화하고 모바일 키보드 대응과 PWA 업데이트 안내를 추가. 8.79MB SVG 배너는 16KB WebP로 교체.",
      en: "Added a same-origin Vercel Functions proxy and image URL normalization, shared profile/session checks, mobile keyboard handling and PWA update prompts. Replaced an 8.79MB SVG banner with a 16KB WebP.",
    },
    stats: [
      { value: "99.8%", label: { ko: "배너 용량 감소 · 8.79MB → 16KB", en: "banner size cut · 8.79MB → 16KB" } },
      { value: "대상", label: { ko: "멋쟁이사자처럼 교내 해커톤", en: "Likelion campus hackathon grand prize" } },
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
    role: { ko: "산학협력 팀 5인 · 팀장 · 기획·디자인·백엔드·모델", en: "Industry-academic team of 5 · lead · planning, design, backend and model" },
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
      { value: "48", label: { ko: "병합한 PR", en: "pull requests merged" } },
    ],
    stack: ["Next.js 15", "FastAPI", "PyTorch"],
    repo: "https://github.com/khy1121/Cropy",
    accent: "#9CD36A",
  },
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
      lead: "숫자로 남은 결과부터. 문제와 과정은 카드에서 펼쳐 볼 수 있습니다.",
      gallery: "미리보기를 누르면 해당 프로젝트로 이동합니다.",
      problem: "문제",
      result: "결과",
      repo: "코드",
      demo: "배포",
      more: "문제와 해결 과정",
      tryIt: "직접 눌러 볼 수 있는 재현",
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
      built: "이 사이트는 Next.js와 Tailwind CSS로 만들었습니다.",
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
      gallery: "Tap a preview to jump to that project.",
      problem: "Problem",
      result: "Result",
      repo: "Code",
      demo: "Live",
      more: "Problem and approach",
      tryIt: "An interactive reproduction",
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
      built: "Built with Next.js and Tailwind CSS.",
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
