# 김헌영 포트폴리오 사이트

등고선(topographic contour)을 언어로 삼은 인터랙티브 포트폴리오. 이력서에 한 줄로 적히던 주장들을 화면에서 만져 볼 수 있게 만드는 것이 목표다.

**Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · React Three Fiber · Lenis**

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npx tsc --noEmit # 타입 검사
npx eslint src   # React 19 컴파일러 규칙 포함
```

## 이 사이트에서 볼 것

| 무엇 | 어디 | 왜 |
|---|---|---|
| **동시 예약 레이스** | 상담 예약 카드 | "Redis SET NX로 슬롯을 선점했다"는 문장을 반증 가능한 실험으로. NX를 끄면 검사-쓰기 사이 60ms 틈으로 중복 예약이 실제로 뚫린다 |
| **3상태 인증 가드** | 해커톤 카드 | 실제로 고친 버그를 상태기계로. 가드를 끄면 "토큰만 있음" 상태에서 화면이 빈 데이터로 깨지는 것을 그대로 재현 |
| **⌘K 커맨드 팔레트** | 전역 | 급한 사람이 두 번의 키 입력으로 섹션·프로젝트·이메일·이력서에 닿는다. "한 장 요약" 탭은 학력·숫자·프로젝트 5개를 한 화면에 |
| **등고선 히어로** | 첫 화면 | fbm 높이맵을 `fract`로 잘라 `fwidth`로 안티에일리어싱한 등고선. 텍스처 0장, 마우스가 지형을 밀어 올린다 |
| **운전 가능한 놀이터** | 놀이터 | 물리 엔진 없이 운동학만으로 굴러가는 저폴리 차. 표지판에 부딪히면 해당 섹션으로 이동 |
| **등고선 테마 전환** | 내비 토글 | 색이 크로스페이드되지 않고, 직전 테마의 배경이 등고선 모양 띠로 물러난다 |

## 설계에서 지킨 선

- **WebGL 컨텍스트는 3개까지.** 히어로·놀이터·푸터. 그 이상은 저사양 기기에서 컨텍스트 손실이 실제로 난다. 나머지 등고선 연출은 canvas 2D로 내렸다.
- **화면 밖이면 멈춘다.** 모든 캔버스와 rAF 루프는 `IntersectionObserver`로 게이팅한다. 히어로 셰이더가 페이지 끝까지 돌던 것을 고친 것이 첫 성능 작업이었다.
- **효과를 꺼도 정보는 100% 남는다.** `prefers-reduced-motion`과 터치 기기에는 각 컴포넌트가 정적 대체본을 렌더한다. 읽어야 할 문단은 최소 불투명도 아래로 내려가지 않는다.
- **첫 화면에 추가되는 JS는 0.** 새 연출은 전부 지연 로드하거나 뷰포트 진입 후에만 동작한다.
- **채용 담당자 경로는 가리지 않는다.** 이메일·이력서 PDF·프로젝트 링크·실제 배포 화면 캡처는 어떤 연출로도 흔들지 않는다.

## 구조

```
src/
  app/            page.tsx(섹션 조립), globals.css(테마 토큰)
  lib/
    content.ts    프로젝트·숫자·프로필 데이터 — 내용 수정은 여기만
    useEnv.ts     모션/포인터/테마/가시성 훅
    glsl.ts       공유 셰이더 조각(심플렉스 노이즈, fbm, 등고선)
    rng.ts        시드 기반 난수(React 컴파일러가 렌더 중 Math.random을 막는다)
  components/
    Hero, TerrainField, Projects, ProjectStage, Playground, About, Timeline, Contact …
    fx/           인터랙션 모듈(RaceSim, GuardMachine, CommandPalette, ThemeWipe …)
```

## 검증

- 프로덕션 빌드, `tsc --noEmit`, `eslint src`(React 19 컴파일러 규칙 포함) 통과
- 360 / 390 / 768 / 1280 / 1440 / 1512px에서 레이아웃 실측 — 가로 스크롤 없음
- 데스크톱 60fps 유지(p95 16.8ms), 다크·라이트 양쪽 확인
