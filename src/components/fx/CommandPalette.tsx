"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { projects, ticker } from "@/lib/content";
import { useCoarsePointer, usePrefersReducedMotion } from "@/lib/useEnv";
import { SummaryCard } from "./SummaryCard";
import { fuzzy } from "./commandFuzzy";

/* ⌘K 커맨드 팔레트.
   섹션 이동 / 프로젝트 링크 / 액션을 한 곳에서 키보드로 실행한다.
   Providers 대신 html[data-theme] 를 직접 만지는 이유는, 이 컴포넌트가
   기존 파일을 건드리지 않고 혼자 붙을 수 있어야 하기 때문. */

const EMAIL = "rlagjsdud3@gmail.com";
const EASE = [0.16, 1, 0.3, 1] as const;
const LIST_ID = "cmdk-list";

type Group = "nav" | "project" | "action";

type Cmd = {
  id: string;
  group: Group;
  label: string;
  note?: string;
  /** 한글 라벨을 "work", "mail" 같은 영문으로도 찾게 해 주는 별칭 모음 */
  keywords: string;
  /** 문자열을 돌려주면 토스트로 보여 준다 */
  run: () => void | string | Promise<void | string>;
};

const GROUPS: { key: Group; title: string }[] = [
  { key: "nav", title: "이동" },
  { key: "project", title: "프로젝트" },
  { key: "action", title: "액션" },
];

/* ---------- 실행 유틸. 전부 effect/handler 안에서만 호출된다 ---------- */

function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** 사이트의 관성 스크롤을 그대로 쓴다. Lenis 가 없으면(모션 최소화) 기본 동작으로. */
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(el, { duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

function scrollToTop() {
  const lenis = window.__lenis;
  if (lenis) lenis.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/** data-theme 를 직접 뒤집고 localStorage("theme") 에도 남긴다. */
function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  root.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch {}
  return next === "light" ? "라이트 테마" : "다크 테마";
}

async function copyEmail() {
  try {
    await navigator.clipboard.writeText(EMAIL);
    return EMAIL + " 복사됨";
  } catch {
    window.location.href = "mailto:" + EMAIL;
    return "메일 앱을 열었습니다";
  }
}

/* ---------- 커맨드 목록. content.ts 의 실제 데이터로 만든다 ---------- */

const SECTIONS = [
  { id: "work", label: "프로젝트", note: "만든 것", keywords: "work projects proj portfolio 작업 만든것 포트폴리오" },
  { id: "play", label: "놀이터", note: "3D 놀이터", keywords: "playground play demo 3d 실험 게임 드라이브" },
  { id: "about", label: "소개", note: "일하는 방식", keywords: "about me profile how i work 자기소개 일하는방식" },
  { id: "timeline", label: "지나온 길", note: "연혁", keywords: "timeline history career path 경력 연혁 이력" },
  { id: "contact", label: "연락", note: "이메일 · GitHub", keywords: "contact email mail hire 연락처 메일 채용" },
];

function buildCommands(): Cmd[] {
  const list: Cmd[] = SECTIONS.map((s) => ({
    id: "go-" + s.id,
    group: "nav",
    label: s.label,
    note: s.note,
    keywords: s.keywords + " go section move 이동 섹션",
    run: () => scrollToSection(s.id),
  }));

  for (const p of projects) {
    const base = `${p.slug} ${p.title} ${p.kind} ${p.stack.join(" ")}`;
    list.push({
      id: "repo-" + p.slug,
      group: "project",
      label: `${p.title} 코드`,
      note: "GitHub",
      keywords: `${base} repo github code source 코드 저장소 깃허브`,
      run: () => openUrl(p.repo),
    });
    if (p.demo) {
      const demo = p.demo; // 클로저 안에서 undefined 로 좁혀지지 않도록 지역 변수로
      list.push({
        id: "demo-" + p.slug,
        group: "project",
        label: `${p.title} 데모`,
        note: p.period,
        keywords: `${base} demo live site preview 배포 데모 사이트`,
        run: () => openUrl(demo),
      });
    }
  }

  list.push(
    {
      id: "copy-email",
      group: "action",
      label: "이메일 복사",
      note: EMAIL,
      keywords: "copy email mail address contact 메일 주소 복사 연락",
      run: copyEmail,
    },
    {
      id: "resume",
      group: "action",
      label: "이력서 PDF 열기",
      note: "/resume.pdf",
      keywords: "resume cv pdf download 이력서 경력기술서 내려받기",
      run: () => openUrl("/resume.pdf"),
    },
    {
      id: "theme",
      group: "action",
      label: "테마 전환",
      note: "다크 ↔ 라이트",
      keywords: "theme dark light mode toggle 테마 다크 라이트 모드",
      run: toggleTheme,
    },
    {
      id: "top",
      group: "action",
      label: "맨 위로",
      note: "처음 화면",
      keywords: "top home hero scroll up 맨위 처음 홈",
      run: scrollToTop,
    },
  );

  return list;
}

const COMMANDS = buildCommands();

/* ---------- 작은 조각들 ---------- */

/** 매칭된 글자만 앰버로. indices 가 비면 그냥 텍스트. */
function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (indices.length === 0) return <>{text}</>;
  const hit = new Set(indices);
  return (
    <>
      {text.split("").map((ch, i) =>
        hit.has(i) ? (
          <mark key={i} className="bg-transparent text-accent">
            {ch}
          </mark>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  );
}

const subscribeNoop = () => () => {};

/** 포털을 쓰기 전 마운트 여부. SSR 에서는 false. */
function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== "string") return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/* ---------- 본체 ---------- */

export function CommandPalette() {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const coarse = useCoarsePointer();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [pastHero, setPastHero] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [toast, setToast] = useState("");
  // 급한 사람을 위한 "한 장 요약" 탭. esc를 누르면 목록으로 먼저 돌아간다.
  const [summary, setSummary] = useState(false);
  // 전역 키 핸들러는 한 번만 붙이므로 최신 값을 ref로 읽는다
  const summaryRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef(0);

  /* 검색 결과: 점수순으로 정렬한 뒤 그룹 순서(이동 → 프로젝트 → 액션)로 다시 묶는다. */
  const results = useMemo(() => {
    const scored: { cmd: Cmd; score: number; indices: number[] }[] = [];
    for (const cmd of COMMANDS) {
      const m = fuzzy(query, cmd.label, cmd.keywords);
      if (m) scored.push({ cmd, score: m.score, indices: m.indices });
    }
    if (query.trim()) scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [query]);

  const { groups, flat } = useMemo(() => {
    const gs: { key: Group; title: string; items: typeof results }[] = [];
    const fl: typeof results = [];
    for (const g of GROUPS) {
      const items = results.filter((r) => r.cmd.group === g.key);
      if (items.length === 0) continue;
      gs.push({ key: g.key, title: g.title, items });
      for (const it of items) fl.push(it);
    }
    return { groups: gs, flat: fl };
  }, [results]);

  const active = flat.length > 0 ? Math.min(index, flat.length - 1) : 0;

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  useEffect(() => {
    if (open) return;
    const id = requestAnimationFrame(() => setSummary(false));
    return () => cancelAnimationFrame(id);
  }, [open]);

  const runCommand = useCallback(
    (cmd: Cmd) => {
      setOpen(false);
      // 패널이 닫히고 Lenis 가 다시 켜진 다음에 실행해야 스크롤 명령이 먹는다
      requestAnimationFrame(() => {
        Promise.resolve()
          .then(() => cmd.run())
          .then((msg) => {
            if (typeof msg === "string") showToast(msg);
          })
          .catch(() => showToast("실행하지 못했습니다"));
      });
    },
    [showToast],
  );

  /* 전역 단축키: ⌘K / Ctrl+K 토글, "/" 열기(입력 중이면 무시), Escape 닫기 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        if (summaryRef.current) {
          e.preventDefault();
          setSummary(false);
          return;
        }
        setOpen((o) => (o ? false : o));
        return;
      }
      if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  /* 맥 여부는 렌더가 아니라 effect 안에서 판별한다 */
  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.userAgent)));
    return () => cancelAnimationFrame(id);
  }, []);

  /* 히어로(#top)를 완전히 지난 뒤에만 트리거 알약을 띄운다 */
  useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) {
      const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.7);
      window.addEventListener("scroll", onScroll, { passive: true });
      const id = requestAnimationFrame(onScroll);
      return () => {
        window.removeEventListener("scroll", onScroll);
        cancelAnimationFrame(id);
      };
    }
    const io = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  /* 열려 있는 동안: 포커스 트랩 + 배경 스크롤 잠금, 닫을 때 원래 포커스로 복귀 */
  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement as HTMLElement | null;

    // 렌더 중이 아니라 rAF 안에서 초기화한다(첫 페인트 전이라 깜빡임 없음)
    const raf = requestAnimationFrame(() => {
      setQuery("");
      setIndex(0);
      inputRef.current?.focus();
    });

    const onFocusIn = (e: FocusEvent) => {
      const panel = panelRef.current;
      if (panel && e.target instanceof Node && !panel.contains(e.target)) inputRef.current?.focus();
    };
    document.addEventListener("focusin", onFocusIn);

    window.__lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("focusin", onFocusIn);
      window.__lenis?.start();
      document.body.style.overflow = prevOverflow;
      if (restore && restore !== document.body && document.contains(restore)) restore.focus();
    };
  }, [open]);

  /* 선택 항목은 목록 안에서만 스크롤시킨다(한 번 읽고 한 번 쓴다) */
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [open, active, query]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return; // 한글 조합 중에는 가로채지 않는다
    const n = flat.length;
    const toNext = e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey);
    const toPrev = e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey);
    if (toNext) {
      e.preventDefault();
      if (n > 0) setIndex((i) => (Math.min(i, n - 1) + 1) % n);
    } else if (toPrev) {
      e.preventDefault();
      if (n > 0) setIndex((i) => (Math.min(i, n - 1) - 1 + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = flat[active];
      if (picked) runCommand(picked.cmd);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  if (!mounted) return null;

  const pillLabel = coarse ? "바로가기" : isMac ? "⌘K" : "Ctrl K";
  const fade = reduced
    ? { transition: "none" }
    : { transition: "opacity 420ms cubic-bezier(0.16,1,0.3,1), transform 420ms cubic-bezier(0.16,1,0.3,1)" };

  return createPortal(
    <>
      {/* 트리거 알약: 히어로를 지나면 나타난다 */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="커맨드 팔레트 열기"
        aria-keyshortcuts="Meta+K Control+K"
        aria-hidden={!pastHero}
        tabIndex={pastHero ? 0 : -1}
        data-hover
        className={
          "fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-line bg-card/90 text-muted backdrop-blur-md hover:text-fg " +
          (coarse ? "min-h-11 px-5 py-3 text-[13px]" : "px-3.5 py-2 text-[12px]")
        }
        style={{
          // 홈 인디케이터에 가리지 않도록 세이프 에어리어만큼 띄운다
          bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
          opacity: pastHero ? 1 : 0,
          pointerEvents: pastHero ? "auto" : "none",
          transform: reduced || pastHero ? "none" : "translateY(10px)",
          ...fade,
        }}
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="font-display font-bold tracking-tight">{pillLabel}</span>
      </button>

      {/* 실행 결과 알림 */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-2xl border border-line bg-card/95 px-4 py-2.5 text-[12px] text-fg backdrop-blur-md"
        style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom, 0px))", opacity: toast ? 1 : 0, ...fade }}
      >
        {toast}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="cmdk"
            className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh] md:pt-[15vh]"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18, ease: EASE }}
          >
            {/* 배경: 클릭하면 닫힌다. 키보드는 Escape 가 맡으므로 장식으로 둔다 */}
            <div aria-hidden className="absolute inset-0 bg-bg/70 backdrop-blur-[3px]" onClick={() => setOpen(false)} />

            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="커맨드 팔레트"
              className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] border border-line bg-card/95 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.75)] backdrop-blur-xl"
              initial={reduced ? false : { opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, y: -10, scale: 0.985 }}
              transition={{ duration: reduced ? 0 : 0.28, ease: EASE }}
            >
              {/* 등고선 텍스처. 읽는 데 방해되지 않을 만큼만 */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage: "repeating-radial-gradient(circle at 12% -20%, var(--fg) 0 1px, transparent 1px 14px)",
                }}
              />

              <div className="relative flex items-center gap-3 border-b border-line px-4 py-3.5">
                <span aria-hidden className="text-[13px] text-accent">
                  ⌘
                </span>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIndex(0);
                  }}
                  onKeyDown={onInputKeyDown}
                  type="text"
                  role="combobox"
                  aria-expanded
                  aria-controls={LIST_ID}
                  aria-autocomplete="list"
                  aria-activedescendant={flat[active] ? LIST_ID + "-opt-" + active : undefined}
                  aria-label="명령 검색"
                  placeholder="섹션, 프로젝트, 액션 검색 (work, mail, theme)"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full bg-transparent text-[14px] text-fg outline-none placeholder:text-muted"
                />
                <kbd aria-hidden className="shrink-0 rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">
                  esc
                </kbd>
              </div>

              {/* 검색어가 없을 때만 보이는 한 줄 요약 */}
              {query.trim() === "" && (
                <div className="relative flex flex-wrap gap-x-4 gap-y-1 border-b border-line px-4 py-2.5 text-[11px] text-muted">
                  <span className="text-fg">김헌영 · 프론트엔드</span>
                  {ticker.slice(0, 3).map((t) => (
                    <span key={t.label.ko}>
                      <span className="text-fg">{t.value}</span> {t.label.ko}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSummary((v) => !v)}
                    aria-pressed={summary}
                    className="ml-auto rounded-full border border-line px-2 py-0.5 text-[11px] text-fg transition-colors hover:border-fg"
                  >
                    {summary ? "명령 목록" : "한 장 요약"}
                  </button>
                </div>
              )}

              {summary && query.trim() === "" ? (
                <SummaryCard
                  onNavigate={(href) => {
                    setOpen(false);
                    requestAnimationFrame(() => scrollToSection(href.replace("#", "")));
                  }}
                />
              ) : (
              <div
                id={LIST_ID}
                ref={listRef}
                role="listbox"
                aria-label="명령 목록"
                className="relative max-h-[50vh] overflow-y-auto overscroll-contain px-2 pb-2"
              >
                {groups.length === 0 && (
                  <p className="px-3 py-10 text-center text-[13px] text-muted">
                    결과가 없습니다. <span className="text-fg">work</span> · <span className="text-fg">mail</span> ·{" "}
                    <span className="text-fg">theme</span> 처럼 영문으로도 찾을 수 있습니다.
                  </p>
                )}
                {groups.map((g) => (
                  <div key={g.key} role="group" aria-label={g.title}>
                    <div aria-hidden className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.22em] text-muted">
                      {g.title}
                    </div>
                    {g.items.map((r) => {
                      const i = flat.indexOf(r);
                      const selected = i === active;
                      return (
                        <button
                          key={r.cmd.id}
                          id={LIST_ID + "-opt-" + i}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          aria-label={r.cmd.note ? r.cmd.label + " — " + r.cmd.note : r.cmd.label}
                          tabIndex={-1}
                          data-selected={selected ? "true" : "false"}
                          onClick={() => runCommand(r.cmd)}
                          onMouseMove={() => {
                            if (!selected) setIndex(i);
                          }}
                          className={
                            "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors " +
                            (selected ? "bg-fg/[0.07] text-fg" : "text-fg/75")
                          }
                        >
                          <span className="min-w-0 flex-1 truncate text-[13.5px]">
                            <Highlight text={r.cmd.label} indices={r.indices} />
                          </span>
                          {r.cmd.note && <span className="shrink-0 text-[11px] text-muted">{r.cmd.note}</span>}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              )}

              <div className="relative flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-[11px] text-muted">
                <span>↑↓ 이동 · ↵ 실행 · esc 닫기</span>
                <span className="shrink-0">{flat.length}개</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
