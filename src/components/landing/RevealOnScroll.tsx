import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms applied to the transition for staggered reveals. */
  delayMs?: number;
  /** Tag to render. Defaults to a div. */
  as?: "div" | "section" | "article" | "header" | "footer";
}

/**
 * Lightweight scroll-reveal wrapper using IntersectionObserver.
 * No JS animation libraries — Tailwind handles the visual via data-visible.
 */
export function RevealOnScroll({
  children,
  className,
  delayMs = 0,
  as: Tag = "div",
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR / no IO support → show immediately
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-visible={visible}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
      className={cn(
        "opacity-0 translate-y-4 transition-all duration-700 ease-out",
        "data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
