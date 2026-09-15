"use client";

import { useSite } from "./Providers";
import { ticker } from "@/lib/content";

export function Marquee() {
  const { lang } = useSite();
  const items = [...ticker, ...ticker];
  return (
    <div className="rule overflow-hidden border-b border-line py-5" aria-label="key numbers">
      <div className="marquee-track gap-14 px-7">
        {items.map((it, i) => (
          <div key={i} className="flex items-baseline gap-3 whitespace-nowrap" aria-hidden={i >= ticker.length}>
            <span className="font-display text-3xl font-bold tabular-nums text-accent md:text-4xl">{it.value}</span>
            <span className="text-sm text-muted">{it.label[lang]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
