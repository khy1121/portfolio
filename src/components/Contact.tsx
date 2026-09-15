"use client";

import { useEffect, useState } from "react";
import { useSite } from "./Providers";
import { copy } from "@/lib/content";
import { Magnetic } from "./Magnetic";

function useSeoulClock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Seoul" });
    const tick = () => setNow(fmt.format(new Date()));
    const id = window.setInterval(tick, 1000);
    const first = requestAnimationFrame(tick);
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(first);
    };
  }, []);
  return now;
}

export function Contact() {
  const { lang } = useSite();
  const t = copy[lang].contact;
  const [copied, setCopied] = useState(false);
  const now = useSeoulClock();

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(t.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${t.email}`;
    }
  };

  const line = "같이 만들 것이 있다면 · Let’s build something · ";
  return (
    <footer id="contact" className="relative mt-28 flex min-h-[100svh] flex-col justify-between overflow-hidden bg-fg text-bg md:mt-40">
      {/* 상단 마퀴 */}
      <div className="border-b border-bg/15 py-5" aria-hidden>
        <div className="marquee-track gap-0">
          {[0, 1].map((k) => (
            <span key={k} className="display whitespace-nowrap px-4 text-[clamp(1.6rem,4vw,3.2rem)] opacity-90">
              {line.repeat(3)}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-5 py-16 md:px-10">
        <p className="text-base opacity-70 md:text-lg">{t.title}</p>
        <button
          onClick={copyEmail}
          className="display mt-4 block break-all text-left text-[clamp(1.7rem,7vw,7rem)] transition-opacity hover:opacity-70"
          data-hover
        >
          {t.email}
        </button>
        <div className="mt-10 flex flex-wrap items-center gap-4 text-sm font-semibold">
          <Magnetic>
            <button onClick={copyEmail} className="rounded-full bg-bg px-5 py-2.5 text-fg transition-colors hover:bg-accent hover:text-bg">
              {copied ? t.copied : t.copy}
            </button>
          </Magnetic>
          <Magnetic>
            <a href="https://github.com/khy1121" target="_blank" rel="noreferrer" className="rounded-full border border-bg/30 px-5 py-2.5 hover:border-bg">
              {t.github}
            </a>
          </Magnetic>
          <Magnetic>
            <a href="/resume.pdf" className="rounded-full border border-bg/30 px-5 py-2.5 hover:border-bg">
              {t.resume}
            </a>
          </Magnetic>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-4 px-5 pb-8 text-xs opacity-70 md:px-10">
        <p>{t.built}</p>
        <p className="font-display tabular-nums">
          서울 <span suppressHydrationWarning>{now || "--:--:--"}</span>
        </p>
      </div>
    </footer>
  );
}
