"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/content";

type Theme = "dark" | "light";

type Ctx = {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  toggleLang: () => void;
};

const SiteContext = createContext<Ctx | null>(null);

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang] = useState<Lang>("ko");

  useEffect(() => {
    // read the persisted theme after mount (the inline script in layout already applied the attribute)
    const id = requestAnimationFrame(() => {
      try {
        if (localStorage.getItem("theme") === "light") setTheme("light");
      } catch {}
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme, lang]);

  return (
    <SiteContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        lang,
        toggleLang: () => {},
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside Providers");
  return ctx;
}
