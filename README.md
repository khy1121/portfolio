# 김헌영 포트폴리오 사이트

Next.js 16 · React 19 · Tailwind 4 · Framer Motion · React Three Fiber

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
```

## 구조

- `src/lib/content.ts` — 모든 문구와 프로젝트 데이터(한/영). 내용 수정은 이 파일만.
- `src/components/ParticleField.tsx` — 히어로 파티클 구체(GLSL 노이즈, 마우스 반발, 스크롤 분산).
- `src/components/Projects.tsx` — 스크롤 스택 카드 + 호버 틸트.
- `src/components/Providers.tsx` — 다크/라이트, 한국어/영어 토글(localStorage 저장).
- `public/resume.pdf` — 이력서 PDF. 교체하면 바로 반영.

## 성능·접근성

- `prefers-reduced-motion`이면 파티클 대신 정적 그라데이션, 커서 효과 비활성.
- 모바일은 파티클 수 1/4, 틸트·마그네틱 비활성.
- 라이트 테마에서는 파티클 블렌딩을 Normal로 전환.
