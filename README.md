# 김헌영 포트폴리오 사이트

이력서에 한 줄로 적히는 주장을, 숫자와 눌러 볼 수 있는 재현으로 보여 주는 포트폴리오. 같은 데이터로 두 가지 화면을 낸다.

| 경로 | 용도 | 성격 |
|---|---|---|
| `/` | 채용 담당자가 1분 안에 훑는 화면 | 이력서형 한 페이지. 왼쪽 고정 메뉴, 고정폭 라벨, 강조색 하나 |
| `/projects/[slug]` | 프로젝트 하나에 집중하는 케이스 스터디 | 미리보기 · 상태·기간·팀·역할·기술 · 숫자 → 문제와 해결 과정 3가지 → 재현 위젯 → 이전/다음 |
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
| Projects | 대표 3개(`featured`)는 크게: 동작 미리보기 · 상태(운영 중/진행 중/종료) · 기간 · 팀 · 숫자 · 기술 · "문제와 해결 과정 보기". 나머지는 한 줄 목록. 모두 `/projects/[slug]` 상세로 연결 |
| Experience · Education | 기간 / 제목 / 소속 / 성과 목록. 자격·수상 |
| Contact | 이메일 복사·GitHub·이력서 PDF |

## 눌러 볼 수 있는 재현

모든 프로젝트 상세(`/projects/[slug]`)의 "직접 눌러 보기"에 문제와 해결 과정 중 하나를 그대로 재현한 위젯이 있다. 스위치로 수정 전/후를 바꿔 차이를 본다. 위젯 위에 따라 누를 순서를 적어 둔다.

| 프로젝트 | 재현하는 문제 | 위젯 |
|---|---|---|
| Overlap | 실시간 동기화가 없으면 바뀐 일정이 안 보여 옛 정보로 추천 | `fx/OverlapSim` |
| 붕붕어스 | 자식 effect가 세션 복구보다 먼저 실행돼 첫 요청이 401 | `fx/BbungSim` |
| NADOK | 코드 분할 후 배포하면 사라진 옛 청크를 요청해 흰 화면 | `fx/NadokSim` |
| Cropy | 신뢰도가 비슷한 두 병해를 하나로 단정해 오진 | `fx/CropySim` |
| MCM Boarding Pass | 토큰만 보는 가드가 프로필 미완성 사용자를 통과시켜 화면이 깨짐 | `fx/GuardMachine` |
| 상담 예약 | 검사-쓰기 사이 틈으로 같은 슬롯에 중복 예약 (SET NX로 차단) | `fx/RaceSim` |

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
    resume/       `/`와 `/projects/[slug]` (Sidebar, Sections, ProjectParts, CopyEmail)
    TerrainField, ProjectStage, ShotGrid   — `/showcase`가 사용
    fx/           재현 위젯(RaceSim, GuardMachine) — 두 화면이 공유
    showcase/     `/showcase` 전용 컴포넌트와 fx/ 연출 모듈
```

## 검증

- 프로덕션 빌드, `tsc --noEmit`, `eslint src`(React 19 컴파일러 규칙 포함) 통과
- 다크·라이트 양쪽 확인
