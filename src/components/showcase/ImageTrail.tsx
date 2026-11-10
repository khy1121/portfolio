"use client";

import { useEffect, useRef } from "react";
import { projects } from "@/lib/content";

/* 마우스가 지나간 자리에 프로젝트 화면이 잠깐 떠올랐다 사라진다. 일정 거리마다 하나씩, DOM 직접 조작으로 가볍게. */
export function ImageTrail({ children, className }: { children: React.ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const shots = projects.filter((p) => p.shot).map((p) => p.shot as string);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let last = { x: -9999, y: -9999 };
    let i = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (Math.hypot(x - last.x, y - last.y) < 90) return;
      last = { x, y };
      const img = document.createElement("img");
      img.src = shots[i++ % shots.length];
      img.alt = "";
      img.draggable = false;
      const rot = (Math.random() - 0.5) * 24;
      Object.assign(img.style, {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        width: "150px",
        borderRadius: "14px",
        pointerEvents: "none",
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(0.6)`,
        opacity: "0",
        transition: "transform 0.5s cubic-bezier(.2,.8,.2,1), opacity 0.5s ease",
        boxShadow: "0 24px 50px -20px rgba(0,0,0,0.6)",
        zIndex: "5",
      } as CSSStyleDeclaration);
      el.appendChild(img);
      requestAnimationFrame(() => {
        img.style.opacity = "1";
        img.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(1)`;
      });
      window.setTimeout(() => {
        img.style.opacity = "0";
        img.style.transform = `translate(-50%, -60%) rotate(${rot}deg) scale(0.9)`;
        window.setTimeout(() => img.remove(), 520);
      }, 700);
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    return () => el.removeEventListener("mousemove", onMove);
  }, [shots]);

  return (
    <div ref={box} className={`relative overflow-hidden ${className ?? ""}`}>
      {children}
    </div>
  );
}
