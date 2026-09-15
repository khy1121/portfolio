"use client";

import { useState } from "react";
import { useSite } from "./Providers";
import { copy } from "@/lib/content";
import { Magnetic } from "./Magnetic";

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
    <footer id="contact" className="rule mx-auto max-w-[1400px] px-5 pb-10 pt-28 md:px-10 md:pt-40">
      <p className="text-muted md:text-lg">{t.title}</p>
      <button
        onClick={copyEmail}
        className="display mt-4 block break-all text-left text-[clamp(1.6rem,6.5vw,6rem)] transition-colors hover:text-accent"
        data-hover
      >
        {t.email}
      </button>
      <div className="mt-8 flex flex-wrap items-center gap-6 text-sm font-semibold">
        <Magnetic>
          <button onClick={copyEmail} className="rounded-full border border-line px-4 py-2 hover:border-fg">
            {copied ? t.copied : t.copy}
          </button>
        </Magnetic>
        <Magnetic>
          <a href="https://github.com/khy1121" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
            {t.github}
          </a>
        </Magnetic>
        <Magnetic>
          <a href="/resume.pdf" className="underline-offset-4 hover:underline">
            {t.resume}
          </a>
        </Magnetic>
      </div>
      <p className="mt-24 text-xs text-muted">{t.built}</p>
    </footer>
  );
}
