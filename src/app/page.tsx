import { Sidebar } from "@/components/resume/Sidebar";
import { About, Contact, Education, Experience, Hero, Projects, Skills } from "@/components/resume/Sections";

/* 이력서형 한 페이지: 왼쪽 고정 메뉴 + Hero → About → Skills → Projects → Experience → Education → Contact */
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1200px] lg:grid lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <main className="min-w-0 px-4 sm:px-8 lg:px-16">
        <div className="max-w-[760px]">
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Education />
          <Contact />
        </div>
      </main>
    </div>
  );
}
