# 김헌영 포트폴리오 사이트

이력서에 한 줄로 적히는 주장을, 숫자와 눌러 볼 수 있는 재현으로 보여 주는 포트폴리오. 같은 데이터로 두 가지 화면을 낸다.

| 경로 | 용도 | 성격 |
|---|---|---|
| `/` | 채용 담당자가 1분 안에 훑는 화면 | 이력서형 한 페이지. 왼쪽 고정 메뉴, 고정폭 라벨, 강조색 하나 |
| `/showcase` | 구현력을 보여 주는 화면 | 커스텀 커서, 겹쳐 쌓이는 카드, ⌘K 팔레트, 등고선 테마 전환 |

**Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · React Three Fiber · Lenis**

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npx tsc --noEmit # 타입 검사
npx eslint src   # React 19 컴파일러 규칙 포함
```

## `/` 구성

이력서를 그대로 옮긴 한 페이지. [congchu/web-porfolio](https://github.com/congchu/web-porfolio)의 왼쪽 고정 메뉴와 타임라인, [RyanFitzgerald/devportfolio](https://github.com/RyanFitzgerald/devportfolio)의 섹션 순서와 미니멀한 표현을 참고했다.

| 구역 | 내용 |
|---|---|
| 사이드바 | 이름·직무, 섹션 메뉴(보고 있는 섹션을 `IntersectionObserver`로 표시), GitHub·이메일·이력서 PDF·인터랙티브 버전, 테마 전환. 모바일에서는 상단 바 |
| Hero · About | 이름·직무·한 줄 소개와 바로가기, 소개 문단 3개 |
| Skills | 분야별 기술 묶음 |
| Projects | 배포 화면 녹화 미리보기(애니메이션 WebP, `public/previews/`) · 기간 · 역할 · 숫자 · 기술 태그 · Live/Code. 문제와 해결 과정 3가지는 `<details>`로 펼친다. 모션 줄이기 설정이면 정지 프레임 |
| Experience · Education | 기간 / 제목 / 소속 / 성과 목록. 자격·수상 |
| Contact | 이메일 복사·GitHub·이력서 PDF |

## 눌러 볼 수 있는 재현

| 무엇 | 어디 | 왜 |
|---|---|---|
| **동시 예약 레이스** | 상담 예약 카드 → 문제와 해결 과정 | "Redis SET NX로 슬롯을 선점했다"는 문장을 실험으로. NX를 끄면 검사-쓰기 사이 틈으로 중복 예약이 실제로 뚫린다 |
| **3상태 인증 가드** | MCM Boarding Pass 카드 → 문제와 해결 과정 | 실제로 고친 버그를 상태기계로. 가드를 끄면 "토큰만 있음" 상태에서 화면이 빈 데이터로 깨지는 것을 재현 |

## `/showcase`에서 더 볼 것

| 무엇 | 왜 |
|---|---|
| **⌘K 커맨드 팔레트** | 두 번의 키 입력으로 섹션·프로젝트·이메일·이력서에 닿는다. "한 장 요약" 탭은 학력·숫자·프로젝트 5개를 한 화면에 |
| **등고선 히어로** | fbm 높이맵을 `fract`로 잘라 `fwidth`로 안티에일리어싱한 등고선. 마우스가 지형을 밀어 올린다 |
| **등고선 테마 전환** | 직전 테마의 배경이 등고선 모양 띠로 물러난다 |

## 설계에서 지킨 선

- **`/`는 WebGL을 쓰지 않고, `/showcase`는 2개.** 화면 밖으로 나가면 `IntersectionObserver`로 멈춘다.
- **효과를 꺼도 정보는 100% 남는다.** `prefers-reduced-motion`이면 셰이더를 그리지 않는다. 재현 위젯도 정적 대체본을 렌더한다.
- **채용 담당자 경로를 가리지 않는다.** 이메일·이력서 PDF·프로젝트 링크·실제 배포 화면 캡처는 어떤 연출로도 흔들지 않는다.
- **숫자는 확인된 것만.** 사용자 수, 테스트 수, 용량 감소율은 이력서·저장소 기록과 같은 값만 둔다.

## 구조

```
src/
  app/            page.tsx(섹션 조립), globals.css(테마 토큰)
  app/showcase/   /showcase 섹션 조립
  lib/
    content.ts    프로젝트·문구·이력서(resume) 데이터 — 내용 수정은 여기만 (두 화면이 공유)
    showcase-content.ts  숫자 띠와 ⌘K 요약 데이터
    useEnv.ts     모션/포인터/테마/가시성 훅
    glsl.ts       공유 셰이더 조각
    rng.ts        시드 기반 난수(React 컴파일러가 렌더 중 Math.random을 막는다)
  components/
    resume/       `/` 전용 (Sidebar, Sections, CopyEmail)
    TerrainField, ProjectStage, ShotGrid   — `/showcase`가 사용
    fx/           재현 위젯(RaceSim, GuardMachine) — 두 화면이 공유
    showcase/     `/showcase` 전용 컴포넌트와 fx/ 연출 모듈
```

## 검증

- 프로덕션 빌드, `tsc --noEmit`, `eslint src`(React 19 컴파일러 규칙 포함) 통과
- 다크·라이트 양쪽 확인
