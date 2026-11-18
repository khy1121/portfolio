"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/lib/useEnv";

/* 재현 위젯들이 함께 쓰는 조각. 팔레트에 위험색이 없어 깨진 상태용 빨강만 테마별로 들고 있는다 */

export function useDanger() {
  return useTheme() === "light" ? "#c0392b" : "#ff7a6b";
}

export const OK = "#34c38f";

export function SimShell({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`w-full rounded-2xl border border-line bg-bg/70 p-4 md:p-5 ${className}`}>
      {children}
    </div>
  );
}

/* "버그 재현" 쪽으로 켜는 스위치. 켜면 위험색이 된다 */
export function BugSwitch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  const danger = useDanger();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex shrink-0 items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs transition-colors hover:border-accent"
    >
      <span className={on ? "font-semibold" : "text-muted"}>{label}</span>
      <span className="relative block h-[14px] w-[26px] rounded-full transition-colors" style={{ background: on ? danger : "var(--line)" }} aria-hidden>
        <span
          className="absolute top-[2px] block h-[10px] w-[10px] rounded-full transition-all duration-200"
          style={{ left: on ? 14 : 2, background: on ? "var(--bg)" : "var(--muted)" }}
        />
      </span>
    </button>
  );
}

export function ActionButton({ children, onClick, disabled = false, primary = false }: { children: ReactNode; onClick: () => void; disabled?: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={disabled}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        disabled
          ? "cursor-default border border-line text-muted opacity-45"
          : primary
            ? "bg-accent text-bg hover:opacity-90"
            : "border border-line hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

/* 결과 한 줄. tone에 따라 색이 바뀌고 스크린리더에 읽힌다 */
export function Verdict({ tone, children }: { tone: "ok" | "bad" | "idle"; children: ReactNode }) {
  const danger = useDanger();
  const color = tone === "ok" ? OK : tone === "bad" ? danger : "var(--muted)";
  return (
    <p aria-live="polite" className="rounded-lg border px-3 py-2 text-sm font-semibold" style={{ borderColor: color, color }}>
      {children}
    </p>
  );
}
