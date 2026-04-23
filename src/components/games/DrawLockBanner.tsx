import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { getDrawState } from "@/lib/draw-state";

const DISMISS_KEY = "winam_draw_lock_banner_dismissed";

export function DrawLockBanner() {
  const [drawState, setDrawState] = React.useState(() => getDrawState(new Date()));
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  });

  // Re-check the state every 60s so the banner appears/disappears at boundaries.
  React.useEffect(() => {
    const id = setInterval(() => {
      setDrawState(getDrawState(new Date()));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  if (drawState !== "locked" || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore — Safari private mode etc.
    }
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1 text-xs font-medium leading-snug">
        Draw tickets locked · Coins only this session
      </p>
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
