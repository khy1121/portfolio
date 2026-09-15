import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Projects } from "@/components/Projects";
import { Playground } from "@/components/Playground";
import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Cursor } from "@/components/Cursor";

export default function Home() {
  return (
    <main>
      <Cursor />
      <Nav />
      <Hero />
      <Marquee />
      <Projects />
      <Playground />
      <About />
      <Contact />
    </main>
  );
}
