import React from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
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

const SWIPE_KEY = "winam_banner_swiped";
const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 400;

export function BannerStack({ banners }: { banners: Banner[] }) {
  const visible = banners.slice(0, 3);

  const [order, setOrder] = React.useState<number[]>(() =>
    visible.map((_, i) => i)
  );
  const [hasSwiped, setHasSwiped] = React.useState(false);
  const [exitDir, setExitDir] = React.useState<1 | -1>(1);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setHasSwiped(window.localStorage.getItem(SWIPE_KEY) === "1");
    }
  }, []);

  if (visible.length === 0) return null;

  const rotate = (direction: 1 | -1) => {
    setExitDir(direction);
    setOrder((prev) => {
      if (prev.length <= 1) return prev;
      const [front, ...rest] = prev;
      return [...rest, front];
    });
    if (!hasSwiped && typeof window !== "undefined") {
      window.localStorage.setItem(SWIPE_KEY, "1");
      setHasSwiped(true);
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (
      Math.abs(offset.x) > SWIPE_THRESHOLD ||
      Math.abs(velocity.x) > VELOCITY_THRESHOLD
    ) {
      rotate(offset.x < 0 ? -1 : 1);
    }
  };

  return (
    <div className="relative h-[104px] select-none">
      <AnimatePresence initial={false} custom={exitDir}>
        {order.map((bannerIdx, stackIdx) => {
          const banner = visible[bannerIdx];
          const isFront = stackIdx === 0;
          const offsetY = stackIdx * 6;
          const scale = 1 - stackIdx * 0.04;
          const z = order.length - stackIdx;

          return (
            <motion.div
              key={banner.id}
              className="absolute inset-x-0 top-0"
              style={{ zIndex: z }}
              initial={{ y: offsetY + 6, scale: scale - 0.04, opacity: 0 }}
              animate={{ y: offsetY, scale, opacity: 1 }}
              exit={{ x: exitDir * 400, opacity: 0, transition: { duration: 0.25 } }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              drag={isFront ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={isFront ? handleDragEnd : undefined}
              whileDrag={isFront ? { cursor: "grabbing" } : undefined}
            >
              <BannerCard
                banner={banner}
                showSwipeHint={isFront && !hasSwiped && order.length > 1}
                draggable={isFront}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function BannerCard({
  banner,
  showSwipeHint,
  draggable,
}: {
  banner: Banner;
  showSwipeHint: boolean;
  draggable: boolean;
}) {
  const Icon = (banner.icon_url && ICON_MAP[banner.icon_url]) || Sparkles;

  return (
    <div
      className={`relative rounded-2xl bg-surface-1 border border-border p-4 shadow-card flex items-start gap-3 ${
        draggable ? "cursor-grab" : ""
      }`}
    >
      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0 pr-10">
        <p className="text-[13px] font-bold text-foreground leading-tight">
          {banner.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">
          {banner.subtitle}
        </p>
      </div>
      {showSwipeHint && (
        <span className="absolute top-2 right-3 text-[10px] text-muted-foreground lowercase tracking-wide">
          swipe
        </span>
      )}
    </div>
  );
}
