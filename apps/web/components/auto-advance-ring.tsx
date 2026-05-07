"use client";

import { useEffect, useState } from "react";

export function AutoAdvanceRing({ durationMs }: { durationMs: number }) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    setRemaining(durationMs);
    const started = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - started;
      const next = Math.max(0, durationMs - elapsed);
      setRemaining(next);
      if (next <= 0) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [durationMs]);

  const pct = Math.max(0, Math.min(1, remaining / durationMs));
  const dash = 2 * Math.PI * 13;
  const offset = dash * (1 - pct);

  return (
    <svg width="22" height="22" viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="13" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2" />
      <circle
        cx="15"
        cy="15"
        r="13"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeDasharray={dash}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 15 15)"
      />
    </svg>
  );
}

