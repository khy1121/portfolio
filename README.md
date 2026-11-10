# 김헌영 포트폴리오 사이트

이력서에 한 줄로 적히는 주장을, 숫자와 눌러 볼 수 있는 재현으로 보여 주는 포트폴리오. 같은 데이터로 두 가지 화면을 낸다.

| 경로 | 용도 | 성격 |
|---|---|---|
| `/` | 채용 담당자가 1분 안에 훑는 화면 | 연출은 첫 화면의 등고선 하나. 숫자 먼저, 과정은 펼쳐서 |
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

| 구역 | 내용 |
|---|---|
| 첫 화면 | 이름·직무·한 줄 소개, 프로젝트 5개 바로가기(숫자 하나씩). 배경은 fbm 높이맵을 `fract`로 잘라 그린 등고선 셰이더 |
| 프로젝트 | 카드마다 숫자 2개가 먼저 보이고, 문제와 해결 과정은 `<details>`로 펼친다 |
| 소개 · 지나온 길 · 연락 | 문단 3개와 기술 태그, 이력서 기준 연표 7개, 이메일·GitHub·이력서 PDF |

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

- **`/`의 WebGL 컨텍스트는 1개, `/showcase`는 2개.** 화면 밖으로 나가면 `IntersectionObserver`로 멈춘다.
- **효과를 꺼도 정보는 100% 남는다.** `prefers-reduced-motion`이면 셰이더를 그리지 않는다. 재현 위젯도 정적 대체본을 렌더한다.
- **채용 담당자 경로를 가리지 않는다.** 이메일·이력서 PDF·프로젝트 링크·실제 배포 화면 캡처는 어떤 연출로도 흔들지 않는다.
- **숫자는 확인된 것만.** 사용자 수, 테스트 수, 용량 감소율은 이력서·저장소 기록과 같은 값만 둔다.

## 구조

```
src/
  app/            page.tsx(섹션 조립), globals.css(테마 토큰)
  app/showcase/   /showcase 섹션 조립
  lib/
    content.ts    프로젝트·문구 데이터 — 내용 수정은 여기만 (두 화면이 공유)
    showcase-content.ts  숫자 띠와 ⌘K 요약 데이터
    useEnv.ts     모션/포인터/테마/가시성 훅
    glsl.ts       공유 셰이더 조각
    rng.ts        시드 기반 난수(React 컴파일러가 렌더 중 Math.random을 막는다)
  components/
    Nav, Hero, TerrainField, Projects, ProjectStage, About, Timeline, Contact   — `/`
    fx/           재현 위젯(RaceSim, GuardMachine) — 두 화면이 공유
    showcase/     `/showcase` 전용 컴포넌트와 fx/ 연출 모듈
```

## 검증

- 프로덕션 빌드, `tsc --noEmit`, `eslint src`(React 19 컴파일러 규칙 포함) 통과
- 다크·라이트 양쪽 확인
