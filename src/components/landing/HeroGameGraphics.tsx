import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "hero" | "intro";

// 4×4 chess board fragment with white queen threatening mate
export function HeroChessFragment({ variant = "hero" }: { variant?: Variant }) {
  // Position is a stylized fragment, not a literal board square mapping.
  // White queen (♕) on the highlighted square threatens the black king (♚).
  const cells: { piece?: string; light: boolean; highlight?: "from" | "to" }[] = [
    { light: true }, { light: false }, { light: true, piece: "♚" }, { light: false },
    { light: false }, { light: true }, { light: false }, { light: true },
    { light: true }, { light: false, piece: "♕", highlight: "to" }, { light: true }, { light: false },
    { light: false }, { light: true }, { light: false, piece: "♔" }, { light: true },
  ];

  const wrapperClass =
    variant === "hero"
      ? "absolute left-0 top-2 sm:top-4 w-[68%] sm:w-[60%] max-w-[300px] rotate-[-6deg]"
      : "w-[78%] max-w-[280px] mx-auto rotate-[-6deg]";

  return (
    <div className={wrapperClass}>
      <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-3 animate-landing-float">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald">
            CheckMate
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            Mate in 1
          </span>
        </div>
        <div className="grid grid-cols-4 gap-0 rounded-lg overflow-hidden border border-border">
          {cells.map((c, i) => (
            <div
              key={i}
              className={cn(
                "relative aspect-square flex items-center justify-center text-2xl sm:text-3xl select-none",
                c.light ? "bg-surface-3" : "bg-surface-2",
                c.highlight === "to" && "ring-2 ring-emerald ring-inset"
              )}
            >
              {c.highlight === "to" && (
                <span
                  aria-hidden
                  className="absolute inset-1 rounded-md animate-landing-pulse-ring"
                />
              )}
              {c.piece && (
                <span
                  className={cn(
                    "relative",
                    c.piece === "♕" || c.piece === "♔"
                      ? "text-foreground animate-landing-piece-glow"
                      : "text-foreground/85"
                  )}
                  style={{ textShadow: "0 1px 1px rgba(0,0,0,0.5)" }}
                >
                  {c.piece}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Proverb fill-in card overlapping the chess fragment
export function HeroProverbCard({ variant = "hero" }: { variant?: Variant }) {
  const wrapperClass =
    variant === "hero"
      ? "absolute right-0 bottom-0 sm:bottom-2 w-[78%] sm:w-[64%] max-w-[320px] rotate-[4deg]"
      : "w-full max-w-[300px] mx-auto rotate-[4deg]";

  return (
    <div className={wrapperClass}>
      <div
        className="rounded-2xl bg-surface-1 border border-border shadow-card p-4 animate-landing-float"
        style={{ animationDelay: "-1.8s" }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-xp">
            WisdomDrop
          </span>
          <span className="text-[10px] text-muted-foreground">Yoruba</span>
        </div>
        <p className="text-sm sm:text-[15px] font-medium text-foreground leading-relaxed mb-3.5">
          "A patient{" "}
          <span className="inline-block min-w-[44px] text-center px-2 py-0.5 rounded-md border border-dashed border-emerald/50 text-emerald text-xs font-semibold tracking-wider align-middle">
            ___
          </span>{" "}
          eats ripe fruit."
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "lion", correct: false },
            { label: "dog", correct: false },
            { label: "man", correct: true },
            { label: "child", correct: false },
          ].map((opt) => (
            <div
              key={opt.label}
              className={cn(
                "relative h-9 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5",
                opt.correct
                  ? "bg-emerald/15 border-emerald/40 text-emerald animate-landing-pulse-ring"
                  : "bg-surface-2 border-border text-muted-foreground"
              )}
            >
              {opt.correct && <Check className="h-3 w-3" />}
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
