import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Playground } from "@/components/Playground";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Cursor } from "@/components/Cursor";
import { Timeline } from "@/components/Timeline";
import { SmoothScroll } from "@/components/SmoothScroll";
import { VelocityMarquee } from "@/components/fx/VelocityMarquee";
import { FilmGrain } from "@/components/fx/FilmGrain";
import { ThemeWipe } from "@/components/fx/ThemeWipe";
import { CommandPalette } from "@/components/fx/CommandPalette";

export default function Home() {
  return (
    <main>
      <SmoothScroll />
      <Cursor />
      <FilmGrain intensity={0.7} />
      <ThemeWipe />
      <Nav />
      <Hero />
      <VelocityMarquee />
      <Projects />
      <Playground />
      <About />
      <Timeline />
      <Contact />
      <CommandPalette />
    </main>
  );
}
