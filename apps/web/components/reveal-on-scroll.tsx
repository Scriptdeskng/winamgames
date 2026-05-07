"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  as?: "div" | "section" | "article" | "header" | "footer";
};

export function RevealOnScroll({
  children,
  className = "",
  delayMs = 0,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      data-visible={visible}
      style={{ transitionDelay: visible ? `${delayMs}ms` : "0ms" }}
      className={[
        "opacity-0 translate-y-4 transition-all duration-700 ease-out",
        "data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}

