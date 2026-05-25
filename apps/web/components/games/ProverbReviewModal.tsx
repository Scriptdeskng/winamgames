"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProverbReview {
  displayText: string;
  blank: string;
  originalProverb: string;
  region: string;
  explanation: string | null;
}

interface ProverbReviewModalProps {
  proverbs: ProverbReview[];
  onClose: () => void;
}

export default function ProverbReviewModal({ proverbs, onClose }: ProverbReviewModalProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.firstElementChild
      ? (trackRef.current.firstElementChild as HTMLElement).offsetWidth + 8
      : trackRef.current.offsetWidth;
    const idx = Math.min(proverbs.length - 1, Math.round(trackRef.current.scrollLeft / cardWidth));
    setActiveIndex(idx);
  }, [proverbs.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col justify-center px-4 gap-2.5"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.92)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          paddingTop: "env(safe-area-inset-top, 16px)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        <div className="flex items-start justify-between py-4 px-1">
          <div>
            <p className="text-base font-semibold text-white">This round's wisdom</p>
            <p className="text-[11px] text-white/45 mt-0.5">
              Swipe — each proverb is worth a moment
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        <div
          ref={trackRef}
          className="flex w-full gap-2 overflow-x-auto flex-shrink-0"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
        >
          {proverbs.map((p, i) => (
            <div
              key={i}
              className="w-full flex-shrink-0 h-[400px] bg-background rounded-2xl border border-border p-5 flex flex-col gap-3 overflow-y-auto"
              style={{ scrollSnapAlign: "start" }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary w-fit">
                {p.region}
              </span>

              <p className="text-base font-medium text-foreground leading-relaxed">
                "{p.displayText}"
              </p>

              <div className="h-px w-full bg-border/50" />

              <div className="space-y-0.5">
                <p className="text-xs italic text-muted-foreground leading-relaxed">
                  "{p.originalProverb}"
                </p>
                <p className="text-[11px] text-muted-foreground/60">— {p.region}</p>
              </div>

              {p.explanation && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/50">
                    Interpretation
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {p.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-1.5 py-4">
          {proverbs.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full bg-white/25 transition-all duration-200",
                i === activeIndex ? "w-3.5 bg-white" : "w-1.5"
              )}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
