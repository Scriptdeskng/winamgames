"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { localStore } from "@/lib/client-utils";
import { getDrawState } from "@/lib/draw-state";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "winam_draw_lock_banner_dismissed";

export interface DrawLockBannerProps {
  className?: string;
}

export default function DrawLockBanner({ className }: DrawLockBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStore.get(DISMISS_KEY);
    if (dismissed === "1") return;
    setVisible(getDrawState(new Date()) === "locked");
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "mx-4 mt-3 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5",
        className,
      )}
    >
      <Lock className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">Draw entries locked</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          New tickets pause until Sunday&apos;s draw at 8pm WAT. Keep playing for coins and XP.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          localStore.set(DISMISS_KEY, "1");
          setVisible(false);
        }}
        className="shrink-0 text-[11px] font-medium text-primary"
      >
        Dismiss
      </button>
    </div>
  );
}
