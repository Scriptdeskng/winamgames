import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LivesDisplayProps {
  lives: number;
  maxLives?: number;
}

export function LivesDisplay({ lives, maxLives = 3 }: LivesDisplayProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxLives }).map((_, i) => (
        <Heart
          key={i}
          className={cn(
            "h-5 w-5 transition-all duration-300",
            i < lives
              ? "text-live fill-live"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}
