"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Flame,
  Shuffle,
  Sparkles,
  Swords,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AnnouncementModal from "@/components/home/AnnouncementModal";
import BannerStack from "@/components/home/BannerStack";
import TopBar from "@/components/layout/TopBar";
import { RANK_CONFIG, type RankTier } from "@/components/profile/RankBadge";
import {
  getActiveBanners,
  getCurrentDrawWeek,
  getPlayer,
  getPlayerMissions,
  getTickets,
} from "@/lib/api";
import { getDrawState, getNextEntriesLockWAT, type DrawState } from "@/lib/draw-state";
import { sessionStore } from "@/lib/session";
import type { DrawWeek, Player, PlayerMission } from "@/types";
import { cn } from "@/lib/utils";

const WEEK_TICKET_CAP = 50;

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getCountdownParts(target: Date, now: Date): CountdownParts {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

interface CountdownUnitProps {
  value: number;
  label: string;
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-4xl font-bold tabular-nums text-foreground">
        {pad2(value)}
      </span>
      <span className="text-[10px] lowercase text-muted-foreground">{label}</span>
    </div>
  );
}

function CountdownColon() {
  return (
    <span className="pb-[14px] font-mono text-4xl font-bold text-foreground">:</span>
  );
}

interface DrawHeroCardProps {
  drawWeek: DrawWeek | null;
  weekTotal: number;
  weekCap: number;
}

function DrawHeroCard({ drawWeek, weekTotal, weekCap }: DrawHeroCardProps) {
  const [now, setNow] = useState(() => new Date());
  const [drawState, setDrawState] = useState<DrawState>(() => getDrawState(new Date()));
  const lockTarget = useMemo(() => getNextEntriesLockWAT(), [drawState]);

  useEffect(() => {
    const drawInterval = window.setInterval(() => {
      const current = new Date();
      setNow(current);
      setDrawState(getDrawState(current));
    }, 60_000);
    return () => window.clearInterval(drawInterval);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  const countdown = getCountdownParts(lockTarget, now);
  const pct = weekCap > 0 ? Math.min(100, (weekTotal / weekCap) * 100) : 0;
  const showDays = countdown.days > 0;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 shadow-card">
      {drawState === "locked" ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Draw closing soon</p>
          <p className="text-xs text-muted-foreground">draw executes at 8pm WAT</p>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {weekTotal}{" "}
            <span className="text-base font-normal text-muted-foreground">
              ticket{weekTotal === 1 ? "" : "s"} this week
            </span>
          </p>
        </div>
      ) : drawState === "drawn" ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">Draw complete</p>
          <Link
            href="/winners"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            See winners
          </Link>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Weekly Draw
          </p>
          <div className="flex items-end justify-start gap-2">
            {showDays ? (
              <>
                <CountdownUnit value={countdown.days} label="days" />
                <CountdownColon />
              </>
            ) : null}
            <CountdownUnit value={countdown.hours} label="hrs" />
            <CountdownColon />
            <CountdownUnit value={countdown.minutes} label="min" />
            <CountdownColon />
            <CountdownUnit value={countdown.seconds} label="sec" />
          </div>
          <p className="mt-3 text-sm tabular-nums text-foreground">
            <span className="font-bold text-primary">{weekTotal}</span>
            <span className="text-muted-foreground"> / {weekCap} tickets this week</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Draw every Sunday at 8pm WAT</p>
            <Link
              href="/entries"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View my tickets <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
      {drawWeek ? (
        <p className="sr-only">Draw week {drawWeek.id}</p>
      ) : null}
    </div>
  );
}

interface StreakRankStripProps {
  player: Player;
}

function resolveRankTier(player: Player): RankTier {
  const key = player.rank.toLowerCase() as RankTier;
  if (key in RANK_CONFIG) return key;
  return "starter";
}

function StreakRankStrip({ player }: StreakRankStripProps) {
  const tier = resolveRankTier(player);
  const config = RANK_CONFIG[tier];
  const RankIcon = config.icon;

  return (
    <div className="flex w-full items-center rounded-xl bg-surface-1/60 px-4 py-2.5">
      <div className="flex flex-1 items-center gap-2">
        <Flame className="size-4 text-streak" aria-hidden />
        <span className="text-sm font-bold tabular-nums text-foreground">{player.streak}</span>
        <span className="text-xs text-muted-foreground">day streak</span>
      </div>
      <div className="mx-4 h-5 w-px bg-border" />
      <div className={cn("flex items-center gap-2 text-sm font-semibold", config.color)}>
        <RankIcon className="size-4 shrink-0" aria-hidden />
        {config.label}
      </div>
    </div>
  );
}

interface MissionRowProps {
  mission: PlayerMission;
}

function pluralizeTickets(amount: number): string {
  return amount === 1 ? "1 ticket" : `${amount} tickets`;
}

const MISSION_META: Record<
  PlayerMission["mission"]["condition_type"],
  { icon: typeof Swords; tint: string }
> = {
  puzzles_solved: { icon: Swords, tint: "bg-primary/15 text-primary" },
  no_hints: { icon: Sparkles, tint: "bg-xp/15 text-xp" },
  streak_day: { icon: Flame, tint: "bg-streak/15 text-streak" },
};

const DEFAULT_MISSION_META = { icon: Shuffle, tint: "bg-primary/15 text-primary" };

function MissionRow({ mission }: MissionRowProps) {
  const { mission: meta, progress, completed } = mission;
  const { icon: Icon, tint } = MISSION_META[meta.condition_type] ?? DEFAULT_MISSION_META;
  const progressPct =
    meta.condition_target > 0
      ? Math.min(100, (progress / meta.condition_target) * 100)
      : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border p-3",
        completed ? "bg-success/10" : "bg-surface-1",
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          completed ? "bg-success/10 text-success" : tint,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p
          className={cn(
            "truncate text-sm font-medium text-foreground",
            completed && "line-through",
          )}
        >
          {meta.title}
        </p>
        {completed ? (
          <p className="text-xs text-success">Reward claimed</p>
        ) : (
          <>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progress}/{meta.condition_target}
            </p>
          </>
        )}
      </div>
      <div className="inline-flex shrink-0 items-center gap-1 rounded-full bg-coin/10 px-2.5 py-1 text-xs font-semibold text-coin">
        <Ticket className="h-3 w-3" aria-hidden />
        {pluralizeTickets(meta.reward_amount)}
      </div>
    </div>
  );
}

interface MissionsSectionProps {
  missions: PlayerMission[];
}

function MissionsSection({ missions }: MissionsSectionProps) {
  const visible = missions.slice(0, 3);
  const completedCount = visible.filter((m) => m.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Missions
        </h2>
        {completedCount > 0 ? (
          <span className="text-xs text-muted-foreground">
            {completedCount}/{visible.length} done
          </span>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
          <Calendar className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">New missions coming soon</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((mission) => (
            <MissionRow key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}

interface PlayCardProps {
  href: string;
  title: string;
  description: string;
  icon: typeof Swords;
  iconWrapClass: string;
  iconClass: string;
  playClassName: string;
}

function PlayCard({
  href,
  title,
  description,
  icon: Icon,
  iconWrapClass,
  iconClass,
  playClassName,
}: PlayCardProps) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-2xl border border-border bg-surface-1 p-4 transition-opacity hover:opacity-90"
    >
      <div className={cn("mb-3 flex size-10 items-center justify-center rounded-xl", iconWrapClass)}>
        <Icon className={cn("size-5", iconClass)} aria-hidden />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <span
        className={cn(
          "mt-3 inline-flex items-center gap-1 text-xs font-semibold",
          playClassName,
        )}
      >
        Play <ChevronRight className="h-3 w-3" />
      </span>
    </Link>
  );
}

export default function HomePage() {
  const session = sessionStore.get();
  const playerId = session?.player.id;

  const playerQuery = useQuery({
    queryKey: ["player", playerId],
    queryFn: () => getPlayer(playerId!),
    enabled: !!playerId,
  });

  const bannersQuery = useQuery({
    queryKey: ["banners"],
    queryFn: getActiveBanners,
  });

  const drawWeekQuery = useQuery({
    queryKey: ["drawWeek"],
    queryFn: getCurrentDrawWeek,
  });

  const missionsQuery = useQuery({
    queryKey: ["missions", playerId],
    queryFn: () => getPlayerMissions(playerId!),
    enabled: !!playerId,
  });

  const ticketsQuery = useQuery({
    queryKey: ["tickets", playerId],
    queryFn: () => getTickets(playerId!),
    enabled: !!playerId,
  });

  useEffect(() => {
    document.documentElement.classList.add("allow-scroll");
    return () => document.documentElement.classList.remove("allow-scroll");
  }, []);

  const weekTotal = useMemo(() => {
    const drawWeekId = drawWeekQuery.data?.id;
    if (!drawWeekId || !ticketsQuery.data) return 0;
    return ticketsQuery.data.filter((t) => t.draw_week_id === drawWeekId).length;
  }, [drawWeekQuery.data?.id, ticketsQuery.data]);

  const isLoading =
    playerQuery.isLoading ||
    bannersQuery.isLoading ||
    drawWeekQuery.isLoading ||
    missionsQuery.isLoading ||
    ticketsQuery.isLoading;

  if (isLoading || !playerQuery.data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  const player = playerQuery.data;
  const banners = bannersQuery.data ?? [];
  const missions = missionsQuery.data ?? [];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] overflow-y-auto bg-background scrollbar-hidden">
      <AnnouncementModal />
      <div className="space-y-5 px-4 pb-6">
        <TopBar />
        <DrawHeroCard
          drawWeek={drawWeekQuery.data ?? null}
          weekTotal={weekTotal}
          weekCap={WEEK_TICKET_CAP}
        />
        <StreakRankStrip player={player} />
        <BannerStack banners={banners} />
        <MissionsSection missions={missions} />

        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Play Now
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <PlayCard
              href="/checkmate"
              title="CheckMate"
              description="Solve chess puzzles"
              icon={Swords}
              iconWrapClass="bg-primary/15"
              iconClass="text-primary"
              playClassName="text-primary"
            />
            <PlayCard
              href="/wisdomdrop"
              title="WisdomDrop"
              description="African proverbs"
              icon={BookOpen}
              iconWrapClass="bg-xp/15"
              iconClass="text-xp"
              playClassName="text-xp"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
