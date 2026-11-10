import { Nav } from "@/components/showcase/Nav";
import { Hero } from "@/components/showcase/Hero";
import { Projects } from "@/components/showcase/Projects";
import { About } from "@/components/showcase/About";
import { Contact } from "@/components/showcase/Contact";
import { Cursor } from "@/components/showcase/Cursor";
import { Timeline } from "@/components/showcase/Timeline";
import { SmoothScroll } from "@/components/showcase/SmoothScroll";
import { VelocityMarquee } from "@/components/showcase/fx/VelocityMarquee";
import { ThemeWipe } from "@/components/showcase/fx/ThemeWipe";
import { CommandPalette } from "@/components/showcase/fx/CommandPalette";

export default function Home() {
  return (
    <main>
      <SmoothScroll />
      <Cursor />
      <ThemeWipe />
      <Nav />
      <Hero />
      <VelocityMarquee />
      <Projects />
      <About />
      <Timeline />
      <Contact />
      <CommandPalette />
    </main>
  );
}
