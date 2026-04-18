import React from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, BookOpen, Sparkles, type LucideIcon } from "lucide-react";

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  icon_url: string | null;
  display_order: number;
};

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  flame: Flame,
  book: BookOpen,
};

const ROTATE_MS = 5000;

export function BannerStack({ banners }: { banners: Banner[] }) {
  const visible = banners.slice(0, 3);
  const N = visible.length;
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    if (N <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % N);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [N]);

  if (N === 0) return null;

  return (
    <div className="relative h-[104px] select-none">
      {visible.map((banner, i) => {
        const slot = (i - activeIndex + N) % N;
        const Icon = (banner.icon_url && ICON_MAP[banner.icon_url]) || Sparkles;

        return (
          <motion.div
            key={banner.id}
            className="absolute inset-x-0 top-0"
            style={{ zIndex: N - slot }}
            animate={{
              y: slot * 6,
              scale: 1 - slot * 0.04,
              opacity: slot < 3 ? 1 : 0,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <div className="relative rounded-2xl bg-surface-1 border border-border p-4 shadow-card flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight">
                  {banner.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">
                  {banner.subtitle}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
