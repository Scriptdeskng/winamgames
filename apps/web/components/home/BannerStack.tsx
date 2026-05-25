"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface Banner {
  id: string;
  title: string;
  body: string;
  is_active: boolean;
  sort_order: number;
}

export interface BannerStackProps {
  banners: Banner[];
  className?: string;
}

export default function BannerStack({ banners, className }: BannerStackProps) {
  const visible = banners.slice(0, 3);
  const [activeIndex, setActiveIndex] = useState(0);
  const n = visible.length;

  useEffect(() => {
    if (n <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % n);
    }, 5000);
    return () => window.clearInterval(id);
  }, [n]);

  if (n === 0) return null;

  return (
    <div className={cn("relative h-[104px] pb-3 select-none", className)}>
      {visible.map((banner, i) => {
        const slot = (i - activeIndex + n) % n;

        return (
          <motion.div
            key={banner.id}
            className="absolute inset-x-0 top-0"
            style={{ zIndex: n - slot }}
            animate={{
              y: slot * 7,
              scale: 1 - slot * 0.04,
              opacity: slot < 3 ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <div
              className={cn(
                "flex h-[88px] items-start gap-3 overflow-hidden rounded-2xl border border-border bg-surface-1 p-4",
                slot === 0 ? "shadow-card" : "",
              )}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Sparkles className="h-7 w-7" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{banner.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{banner.body}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
