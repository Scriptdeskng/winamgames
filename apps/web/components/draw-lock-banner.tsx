"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const DISMISS_KEY = "winam_draw_lock_banner_dismissed";

function getDrawState() {
  const now = new Date(Date.now() + 60 * 60 * 1000);
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 0 && hour >= 19 && hour < 20) return "locked";
  return "open";
}

export function DrawLockBanner() {
  const [drawState, setDrawState] = useState(getDrawState);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    const id = setInterval(() => setDrawState(getDrawState()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (drawState !== "locked" || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1 text-xs font-medium leading-snug">Draw tickets locked · Coins only this round</p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-amber-200/80 hover:bg-amber-500/15 hover:text-amber-100 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

