import {
  siAnthropic,
  siChromatic,
  siDocker,
  siEslint,
  siFastapi,
  siFigma,
  siGit,
  siGithub,
  siGithubactions,
  siJavascript,
  siNextdotjs,
  siOnnx,
  siPostgresql,
  siPwa,
  siPython,
  siPytorch,
  siReact,
  siReactrouter,
  siStorybook,
  siSupabase,
  siTailwindcss,
  siTestinglibrary,
  siThreedotjs,
  siTypescript,
  siUpstash,
  siVercel,
  siVitest,
  type SimpleIcon,
} from "simple-icons";

/* GitHub 프로필 README의 기술 뱃지와 같은 구성. 아이콘은 simple-icons에서 인라인 SVG로 그린다(외부 요청 없음).
   icon이 없는 항목은 글자만 있는 회색 뱃지로 그린다. color를 주면 공식 색 대신 그 색을 쓴다 */
export type Skill = { name: string; icon?: SimpleIcon; color?: string };

export const skillGroups: { group: string; items: Skill[] }[] = [
  { group: "언어", items: [{ name: "TypeScript", icon: siTypescript }, { name: "JavaScript", icon: siJavascript }, { name: "Python", icon: siPython }] },
  {
    group: "프론트엔드",
    items: [
      { name: "React", icon: siReact },
      { name: "Next.js", icon: siNextdotjs },
      { name: "React Router", icon: siReactrouter },
      { name: "Tailwind CSS", icon: siTailwindcss },
      { name: "three.js", icon: siThreedotjs },
    ],
  },
  {
    group: "데이터·API",
    items: [{ name: "Supabase", icon: siSupabase }, { name: "PostgreSQL", icon: siPostgresql }, { name: "Upstash Redis", icon: siUpstash }, { name: "REST API" }],
  },
  {
    group: "오프라인·PWA",
    items: [{ name: "PWA", icon: siPwa }, { name: "Service Worker" }, { name: "IndexedDB" }, { name: "ONNX Runtime Web", icon: siOnnx }],
  },
  {
    group: "테스트·품질",
    items: [
      { name: "Vitest", icon: siVitest },
      { name: "Testing Library", icon: siTestinglibrary },
      { name: "Storybook", icon: siStorybook },
      { name: "Chromatic", icon: siChromatic },
      { name: "ESLint", icon: siEslint },
    ],
  },
  {
    group: "배포·협업",
    items: [
      { name: "Vercel", icon: siVercel },
      { name: "GitHub Actions", icon: siGithubactions },
      { name: "Docker", icon: siDocker },
      { name: "Git", icon: siGit },
      { name: "GitHub", icon: siGithub },
      { name: "Figma", icon: siFigma },
    ],
  },
  {
    group: "AI·모델 (팀 프로젝트)",
    items: [{ name: "FastAPI", icon: siFastapi }, { name: "PyTorch", icon: siPytorch }, { name: "Claude Code", icon: siAnthropic, color: "D97757" }],
  },
];
