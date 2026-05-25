"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LivesDisplayProps {
  lives: number;
  maxLives: number;
  className?: string;
}

export default function LivesDisplay({ lives, maxLives, className }: LivesDisplayProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`${lives} of ${maxLives} lives`}>
      {Array.from({ length: maxLives }, (_, i) => {
        const filled = i < lives;
        return (
          <Heart
            key={i}
            className={cn(
              "h-6 w-6",
              filled ? "fill-destructive text-destructive" : "text-muted-foreground/40",
            )}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
