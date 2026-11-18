export type Lang = "ko" | "en";

type L = { ko: string; en: string };

export type Case = { title: string; problem: string; solution: string; result: string };

export type Project = {
  slug: string;
  title: string;
  kind: string;
  shot?: string;
  thumb?: string; // 갤러리용 16:10 미리보기
  /* 배포 화면을 녹화한 동작 미리보기(애니메이션 WebP)와 정지 프레임. note는 녹화 조건 */
  preview?: { src: string; poster: string; note?: string };
  period: string;
  role: L;
  summary: L;
  problem: L;
  result: L;
  /* 기본 페이지(/)의 "문제와 해결 과정"에 펼쳐 보이는 사례. 프로젝트마다 3개 */
  cases: Case[];
  stats: { value: string; label: L }[];
  stack: string[];
  repo?: string;
  demo?: string;
  accent: string;
};

export const projects: Project[] = [
  {
    slug: "omfres",
    preview: { src: "/previews/omfres.webp", poster: "/previews/omfres-poster.webp", note: "배포 사이트 녹화 · 예약 제출 전까지" },
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
    cases: [
      { title: "같은 시간대 중복 예약", problem: "학생 여러 명이 같은 시간을 동시에 누르면, 빈자리 확인과 저장 사이에 다른 요청이 끼어 한 자리에 두 명이 예약될 수 있었다.", solution: "DB UNIQUE 제약·트랜잭션과 Redis SET NX를 비교했다. 예약이 '교수·날짜·시간' 한 칸 단위라 칸 하나를 키 하나로 두고 SET NX로 선점하게 했다. 서버리스에서 DB 연결을 오래 붙잡지 않는 점도 고려했다.", result: "먼저 도착한 요청만 성공하고 늦은 요청은 HTTP 409로 거절한다. 아래 재현에서 NX를 끄면 중복 예약이 실제로 뚫린다." },
      { title: "계정 없이 관리자 화면 지키기", problem: "관리자 계정 체계를 붙이기엔 과했지만, PIN 하나만 두면 유출됐을 때 대응할 방법이 없었다.", solution: "PIN은 해시로 저장하고, 세션 서명 키를 PIN 해시에서 만들었다.", result: "PIN을 바꾸면 기존 관리자 세션이 모두 무효화된다." },
      { title: "운영 중 들어온 요청", problem: "처음 넣은 학번 입력이 예약을 번거롭게 했고, 운영 중 연구실 변경과 예약 이동 요청이 들어왔다.", solution: "가입·학번을 없애고 교수 → 날짜·시간 → 이름 3단계로 줄였다. 요일별 시간대·상담 단위·제외 날짜로 슬롯을 만드는 로직을 분리했다.", result: "연구실 변경은 당일 반영했고, 관리자 캘린더·예약 이동·CSV 내보내기를 운영 중에 추가했다. 상담자를 추가하면 바로 예약을 받는다." },
    ],
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
    preview: { src: "/previews/overlap.webp", poster: "/previews/overlap-poster.webp", note: "배포 사이트 녹화 · 본인 테스트 약속" },
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
      ko: "초대된 약속에 일정을 한 번 입력하면 전원이 되는 시간과 추천 시간을 계산. Supabase Realtime으로 입력을 동기화하고 RLS로 본인 일정만 수정하게 제한. 2주간 17명이 가입해 14명이 일정을 입력했고, 2~7명이 참여한 회의 6건을 확정.",
      en: "One entry per person yields the shared and recommended slots. Supabase Realtime syncs input and RLS limits edits to your own schedule. In two weeks 17 people signed up, 14 entered availability, and 6 meetings of 2–7 people were settled.",
    },
    cases: [
      { title: "여러 명이 동시에 칠하는 시간표", problem: "각자 시간표를 칠하는 동안 다른 사람 입력이 보이지 않으면 결국 메신저로 다시 확인해야 했다.", solution: "Supabase Realtime으로 입력을 바로 동기화하고, RLS 정책으로 자기 일정만 고칠 수 있게 했다.", result: "전원 가능 시간과 추천 시간을 연속 구간으로 보여 주고, 입력한 사람이 절반이 안 되면 확정 대신 초대부터 권한다." },
      { title: "가입과 초대의 부담", problem: "일정 하나 맞추자고 이메일 가입을 요구하면 팀원이 들어오지 않는다.", solution: "이메일 없이 가입하게 하고, Edge Function이 SHA-256(이름|생년월일)로 내부 식별자를 만든다. 카카오 로그인과 카톡 공유 초대를 붙였다.", result: "생년월일은 저장하지 않는다. Google 캘린더는 free/busy 범위만 요청해 일정 내용은 받지 않는다." },
      { title: "직접 쓰면서 찾은 버그", problem: "카카오톡 인앱 브라우저·갤럭시 큰 글꼴에서 화면이 옆으로 밀렸고, 새 버전 배포 직후 흰 화면이 떴다.", solution: "뷰포트 폭과 글꼴 확대에 맞춰 레이아웃을 고치고, 배포 직후 MIME text/html로 깨지는 경우를 막았다.", result: "앱을 켜 둔 사이 새 버전이 나오면 새로고침 안내를 띄운다. 2주간 17명이 가입해 14명이 일정을 입력했고, 회의 6건을 확정했다." },
    ],
    stats: [
      { value: "6", label: { ko: "확정한 회의 · 2~7명", en: "meetings settled · 2–7 people" } },
      { value: "14", label: { ko: "일정 입력 사용자 · 가입 17", en: "people entered availability · 17 signed up" } },
    ],
    stack: ["React 18", "Vite", "Supabase", "PWA"],
    repo: "https://github.com/khy1121/overlap",
    demo: "https://overlap-liard.vercel.app",
    accent: "#F2B544",
  },
  {
    slug: "bbung",
    preview: { src: "/previews/bbung.webp", poster: "/previews/bbung-poster.webp", note: "배포 사이트 녹화 · 경로 지도는 가림" },
    title: "붕붕어스",
    kind: "커플 드라이브 기록 웹앱",
    period: "2026.10 – 11",
    role: { ko: "4호선톤 해커톤 · 프론트엔드 2인 · 커밋 83% · PR 80/108", en: "Line 4 hackathon · 2 frontend devs · 83% of commits · 80 of 108 PRs" },
    summary: {
      ko: "연인과 함께한 드라이브를 기록하고, 테마별 장소 추천과 기록 지도로 다시 떠날 곳을 찾는 모바일 웹앱",
      en: "A mobile web app for couples to record drives, discover places by theme and revisit them on a map",
    },
    problem: {
      ko: "앱을 다시 열면 첫 요청들이 토큰 없이 나가 401을 받았고, 준비만 하고 나간 드라이브가 커플 연결 해제를 막았다.",
      en: "On reopen, the first requests went out without a token and got 401, and abandoned drafts blocked disconnecting a couple.",
    },
    result: {
      ko: "초기화 단계에서 저장된 토큰을 미리 싣고, 연결 해제를 막는 드라이브를 시트에서 정리하게 했다. Storybook·Chromatic으로 PR마다 화면 변경을 비교하고 테스트 파일 130개를 유지.",
      en: "Primed the stored token at startup and let users clear a blocking drive from the sheet. Compared UI changes per PR with Storybook and Chromatic, with 130 test files.",
    },
    cases: [
      { title: "앱을 열자마자 401이 나던 첫 요청", problem: "로그인한 사용자가 앱을 다시 열면 홈·진행 중 드라이브 조회가 토큰 없이 나가 401을 받았다. React는 자식 화면의 effect를 App의 세션 복구보다 먼저 실행하기 때문이었다.", solution: "인증 상태를 정하는 초기화 단계에서 저장된 토큰을 읽어 API 클라이언트에 바로 실어 두도록 바꿨다(loadStoredSession).", result: "첫 요청부터 토큰이 실려 나가고, 같은 상황을 재현하는 토큰 갱신 테스트를 추가했다." },
      { title: "준비만 하고 나간 드라이브가 연결 해제를 막음", problem: "경로 설정 중에 나가면 '준비 중' 드라이브가 남아 커플 연결 해제가 ACTIVE_DRIVE_EXISTS로 막혔는데, 드라이브 화면에는 준비 중인 드라이브를 끝낼 버튼이 없었다.", solution: "연결 해제 실패 원인을 구분해, 준비 중이면 시트에서 바로 취소하고 이미 출발한 드라이브는 드라이브 화면으로 보내 마치게 했다. 홈 배너도 '준비 중인 드라이브'를 따로 알린다.", result: "사용자가 스스로 빠져나올 수 있는 경로를 만들었고, 세 가지 결과(취소·이동·없음)를 테스트와 Storybook 스토리로 남겼다." },
      { title: "시트가 열릴 때 화면 전체가 들썩임", problem: "바텀시트·팝업이 올라올 때 화면 전체가 위아래로 튀었다.", solution: "원인은 접근성을 위해 시트로 포커스를 옮길 때 브라우저가 해당 요소로 스크롤한 것이었다. 포커스 이동은 유지하고 focus({ preventScroll: true })로 스크롤만 막았다.", result: "키보드·스크린리더 사용자의 포커스 흐름은 그대로 두고 흔들림을 없앴으며, 회귀 테스트를 추가했다." },
    ],
    stats: [
      { value: "83%", label: { ko: "커밋 410/496", en: "commits 410/496" } },
      { value: "130", label: { ko: "테스트 파일", en: "test files" } },
    ],
    stack: ["React 19", "TypeScript", "Vite", "Storybook", "Chromatic"],
    repo: "https://github.com/2026-line4thon-team6/2026-line4thon-team6-FE",
    demo: "https://2026-line4thon-team6-fe.vercel.app/",
    accent: "#F2867A",
  },
  {
    slug: "boardingpass",
    preview: { src: "/previews/boardingpass.webp", poster: "/previews/boardingpass-poster.webp", note: "백엔드 종료 후 목 데이터 모드로 녹화" },
    thumb: "/shots/thumbs/boardingpass.webp",
    title: "MCM Boarding Pass",
    kind: "패션 브랜드 매장 체험 웹",
    shot: "/shots/boardingpass.webp",
    period: "2026.08",
    role: { ko: "해커톤 팀 6인 · 프론트엔드 총괄(FE 2인) · 커밋 75%", en: "Hackathon team of 6 · frontend lead (2 FE) · 75% of commits" },
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
    cases: [
      { title: "가입 중 이탈한 사용자의 재진입", problem: "카카오 인증 후 추가 정보를 넣지 않고 나간 사용자가 돌아오면 보호 화면이 빈 데이터로 깨졌다. 가드가 토큰 유무만 봤기 때문이다.", solution: "사용자 상태를 비로그인 · 토큰만 있음 · 프로필 완성 셋으로 나누고, StrictMode에서 인가 코드가 두 번 소비되던 문제는 1회 소비 가드로 막았다.", result: "프로필이 미완성이면 가입 2단계로 돌려보내고, 세션 복원 테스트를 작성했다. 아래 재현에서 가드를 끄면 화면이 깨진다." },
      { title: "카카오톡에서 하단 버튼이 가려짐", problem: "링크가 주로 카톡으로 공유되는데, 인앱 브라우저에서 하단 버튼을 누를 수 없었다.", solution: "iOS에서 lvh·dvh 계산이 틀린다는 WebKit 버그 리포트를 확인하고, CSS 단위 대신 실제로 보이는 높이를 재서 쓰게 했다.", result: "짧은 화면은 여백과 그림을 비율대로 줄여 393×655 재현 환경에서 넘침 0을 확인했다." },
      { title: "실서버 API 31개 연동과 검증", problem: "목 데이터로 만든 18개 화면을 마감 전에 실제 API에 붙여야 했다.", solution: "응답·에러·401 처리를 공통 apiFetch로 모으고, AbortController로 이전 요청을 취소했다. 막힌 4건은 원인을 좁혀 백엔드에 문서로 넘겼다.", result: "31개 중 30개를 연동했고, 제출 시 44개 파일 368개 테스트 통과를 확인했다." },
    ],
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
    preview: { src: "/previews/nadok.webp", poster: "/previews/nadok-poster.webp", note: "백엔드 종료 후 목 데이터 모드로 녹화" },
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
    cases: [
      { title: "배포하자마자 막힌 백엔드 호출", problem: "HTTPS 페이지에서 HTTP 백엔드를 부르니 Mixed Content로 전부 막혔고, 서버 주소도 클라이언트 코드에 드러나 있었다.", solution: "Vercel Function 프록시와 rewrite로 /api, /uploads 요청을 거쳐 가게 하고, 실제 주소는 환경변수에만 두었다.", result: "HTTPS 페이지에서 HTTP 주소를 쓰면 axios 단계에서 막히게 해 같은 실수를 반복하지 않게 했다." },
      { title: "배포할 때마다 흰 화면 위험", problem: "코드 분할 후 배포하면, 열어 둔 화면이 사라진 옛 파일을 요청해 하얗게 깨질 수 있었다.", solution: "없는 파일은 404로 응답하게 하고, 화면 파일을 못 받으면 한 번만 새로고침한다. PWA는 30분마다와 복귀 시 업데이트를 확인해 배너로 알린다.", result: "성능 기법이 새 실패를 만든다는 것을 배웠다. 도입할 때 실패 상황까지 함께 설계한다." },
      { title: "성공처럼 보이던 분석 실패", problem: "감정 분석 API가 실패해도 기본 캐릭터가 떠서 사용자가 실패를 알 수 없었다.", solution: "실패하면 오류 화면과 재시도로 보내고, 백엔드가 대체 결과를 주면 '임의 추천' 배너를 붙였다.", result: "함께 8.79MB SVG 배너를 16KB WebP로 바꾸는 등 경량화로 첫 방문 전송량을 23MB에서 2.3MB로 줄였다." },
    ],
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
    preview: { src: "/previews/cropy.webp", poster: "/previews/cropy-poster.webp", note: "배포 사이트 녹화 · 인터넷 없이 기기에서 진단" },
    title: "Cropy",
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
    cases: [
      { title: "통신이 끊긴 농지에서의 진단", problem: "농지는 통신이 자주 끊겨, 서버 진단에만 의존하면 현장에서 쓸 수 없었다.", solution: "ONNX Runtime Web·Service Worker·IndexedDB로 브라우저 안에서 진단하고 기록을 저장한다. 저장이 실패하면 같은 사진으로 다시 시도할 수 있게 했다.", result: "다시 연결되면 기기 기록을 서버와 동기화한다. 이력 화면에는 필터·빈 상태·재조회를 추가했다." },
      { title: "자꾸 헷갈리는 병해 한 쌍", problem: "ResNet50으로 test 정확도 93.1%를 얻었지만, 오분류 44건 중 26건(59%)이 무 검은무늬병 ↔ 무 노균병 한 쌍에 몰렸다.", solution: "두 후보의 신뢰도가 비슷하면 하나로 단정하지 않고, 구분에 필요한 부위를 다시 찍게 안내해 두 결과를 합쳐 확정하는 흐름을 설계했다.", result: "이 쌍만 구분하는 분류기도 실험했지만 나은 점이 없어 채택하지 않았고, 결과를 모델 문서에 남겼다." },
      { title: "동급생 팀원에게 일 나누기", problem: "동급생에게 지시가 부담스러워 각자 할 일을 정해 오라 했더니 '뭘 할지 모르겠다'는 답이 돌아왔다.", solution: "자율은 배려가 아니라 팀장 일을 미룬 것이라고 판단하고, 주차별 스프린트와 GitHub 이슈로 작업을 나눴다. 모델이 없을 때는 Mock 모드로 돌게 했다.", result: "첫날 문서 21종과 기본 코드를 올려 바로 개발을 시작했고, 팀 저장소에 PR 48건을 병합했다. PR마다 GitHub Actions로 테스트·빌드를 검사한다." },
    ],
    stats: [
      { value: "9", label: { ko: "분류 클래스", en: "classification classes" } },
      { value: "48", label: { ko: "병합한 PR", en: "pull requests merged" } },
    ],
    stack: ["Next.js 15", "FastAPI", "PyTorch"],
    repo: "https://github.com/khy1121/Cropy",
    demo: "https://43.202.14.204.sslip.io/",
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

/* 기본 페이지(/)의 이력서형 구성에 쓰는 데이터. 이력서(이력서_catsbi형식.md)와 같은 내용을 유지한다. */
export const resume = {
  name: "김헌영",
  title: "Frontend Developer",
  tagline: "요청이 실패하거나 연결이 끊겨도 사용 흐름이 이어지도록, 화면 상태와 복구 경로부터 설계합니다.",
  email: "rlagjsdud3@gmail.com",
  github: "https://github.com/khy1121",
  about: [
    "실제로 쓰이는 서비스를 끝까지 운영하는 신입 프론트엔드 개발자입니다. 팀 회의 일정을 맞추느라 서너 번씩 오가던 연락을 줄이려고 만든 Overlap은 출시 2주 만에 17명이 가입해 14명이 일정을 입력했고, 회의 6건을 확정했습니다. 운영하며 들어온 의견은 바로 기능으로 반영합니다.",
    "기능을 만들 때 \"이게 실패하면 사용자는 다음에 무엇을 할 수 있나\"를 먼저 정합니다. 동시 예약 경합, 채팅 전송 실패, 오프라인 진단, 배포 직후 흰 화면처럼 사용자가 막히는 지점을 찾아 복구 경로를 설계해 왔습니다.",
    "팀에서는 PR 단위로 협업합니다. PR마다 변경 범위, 테스트·빌드 결과, 검증하지 못한 항목을 남깁니다. 코딩 에이전트로 초안을 만들되, 테스트와 린트를 통과한 코드만 직접 읽고 반영합니다.",
  ],
  skills: [
    { group: "언어", items: ["TypeScript", "JavaScript", "Python"] },
    { group: "프론트엔드", items: ["React", "Next.js (App Router)", "React Router", "Tailwind CSS", "three.js"] },
    { group: "데이터·API", items: ["REST API", "Route Handlers", "Supabase", "Upstash Redis"] },
    { group: "오프라인·PWA", items: ["Service Worker", "IndexedDB", "Web Push", "ONNX Runtime Web"] },
    { group: "테스트·품질", items: ["Vitest", "Testing Library", "Storybook", "Chromatic", "ESLint"] },
    { group: "배포·협업", items: ["Vercel", "GitHub Actions", "Docker Compose", "Git/GitHub", "Figma"] },
  ],
  experience: [
    {
      org: "Cropy 산학협력 프로젝트",
      title: "팀장 · 기획·디자인·백엔드·모델",
      period: "2026.09 – 진행 중",
      bullets: [
        "팀 5인. 첫날 문서 21종과 백엔드·프론트·ML 기본 코드를 올려 팀이 바로 개발을 시작하게 함",
        "주차별 스프린트와 GitHub 이슈로 작업을 나누고, 팀 저장소에 PR 48건 병합",
        "통신이 끊겨도 브라우저에서 진단·저장하는 오프라인 기능 구현 (ONNX Runtime Web)",
      ],
    },
    {
      org: "멋쟁이사자처럼 14기",
      title: "프론트엔드 트랙",
      period: "2026.03 – 2026.07",
      bullets: [
        "React 교육 과정 수료",
        "교내 해커톤 대상 (NADOK), 연합 해커톤 프론트엔드 총괄 (MCM Boarding Pass)",
      ],
    },
    {
      org: "창업동아리",
      title: "기획 담당",
      period: "2026",
      bullets: ["문제 정의, 기능 우선순위 결정, 심사·제출 문서 작성"],
    },
  ],
  education: [
    {
      school: "한성대학교",
      degree: "컴퓨터공학부 웹공학트랙 · 졸업예정",
      period: "2021.03 – 2027.02",
      achievements: ["전공 평점 3.94 / 4.5", "단과대 최우수 장학금 (3학년 2학기)"],
    },
  ],
  certificates: [
    { when: "2026.12", name: "정보처리기사 (취득 예정)" },
    { when: "2026.09", name: "SQLD" },
    { when: "2026.05", name: "멋쟁이사자처럼 교내 해커톤 대상" },
  ],
};

export const sections = [
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
] as const;

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
