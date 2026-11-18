"use client";

import { useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  };

  return (
    <button onClick={copy} className="rounded bg-accent px-5 py-2.5 text-bg hover:opacity-90">
      {copied ? "복사됨" : "이메일 복사"}
    </button>
  );
}
