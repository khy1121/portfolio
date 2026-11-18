"use client";

export function PrintButton() {
  return (
    <div className="flex gap-2">
      <a href="/resume.pdf" className="rounded-full border border-[#c9ced2] px-4 py-1.5 text-xs font-semibold text-[#14181b] hover:border-[#14181b]">
        PDF 받기
      </a>
      <button type="button" onClick={() => window.print()} className="rounded-full bg-[#14181b] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90">
        인쇄
      </button>
    </div>
  );
}
