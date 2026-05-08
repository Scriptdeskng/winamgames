"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { popNavHistory } from "@/lib/nav-history";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  fallbackHref: string;
  className?: string;
  "aria-label"?: string;
};

export function BackButton({ fallbackHref, className, "aria-label": ariaLabel = "Back" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    const target = popNavHistory();
    if (target) {
      router.replace(target);
      return;
    }
    router.replace(fallbackHref);
  }, [fallbackHref, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors",
        className,
      )}
      aria-label={ariaLabel}
    >
      <ArrowLeft className="h-5 w-5 text-foreground" />
    </button>
  );
}
