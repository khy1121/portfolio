"use client";

import { useState } from "react";
import { useSite } from "./Providers";
import { copy } from "@/lib/content";

export function Contact() {
  const { lang } = useSite();
  const t = copy[lang].contact;
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(t.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${t.email}`;
    }
  };

  return (
    <footer id="contact" className="rule mx-auto max-w-[1100px] scroll-mt-16 px-5 py-20 md:px-8 md:py-28">
      <p className="text-muted">{t.title}</p>
      <a href={`mailto:${t.email}`} className="display mt-3 block break-all text-[clamp(1.6rem,4.5vw,3.2rem)] hover:text-accent">
        {t.email}
      </a>
      <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold">
        <button onClick={copyEmail} className="rounded-full bg-fg px-5 py-2.5 text-bg transition-colors hover:bg-accent">
          {copied ? t.copied : t.copy}
        </button>
        <a href="https://github.com/khy1121" target="_blank" rel="noreferrer" className="rounded-full border border-line px-5 py-2.5 hover:border-fg">
          {t.github}
        </a>
        <a href="/resume.pdf" className="rounded-full border border-line px-5 py-2.5 hover:border-fg">
          {t.resume}
        </a>
      </div>
      <p className="mt-16 text-xs text-muted">{t.built}</p>
    </footer>
  );
}
