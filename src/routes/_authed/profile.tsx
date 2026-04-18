import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import {
  User, Coins, Flame, Ticket, Award, LogOut, ChevronRight, ArrowRight, Clock, Info, Pencil,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import { RANK_CONFIG, type RankTier } from "@/components/profile/RankBadge";
import { getPlayerData, updateNickname } from "@/utils/mission.functions";
import { getSession, clearSession, updateSessionNickname } from "@/lib/session";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import { toast } from "sonner";
import React from "react";

export const Route = createFileRoute("/_authed/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Profile — WinamGames" }],
  }),
  loader: async () => null,
});

// ── Countdown helpers (next Sunday 20:00 WAT == 19:00 UTC) ───────────
function getNextSundayWAT(): Date {
  const now = new Date();
  const target = new Date(now);
  const dayUTC = now.getUTCDay();
  let daysUntil = (7 - dayUTC) % 7;
  target.setUTCHours(19, 0, 0, 0);
  if (daysUntil === 0 && now.getTime() >= target.getTime()) {
    daysUntil = 7;
  }
  target.setUTCDate(now.getUTCDate() + daysUntil);
  target.setUTCHours(19, 0, 0, 0);
  return target;
}

function formatCountdown(targetMs: number): string {
  const diff = Math.max(0, targetMs - Date.now());
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function streakBonus(streak: number): number {
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1;
  return 0;
}

function ProfilePage() {
  useAllowScroll();
  const navigate = useNavigate();
  const session = getSession();
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!session) return;
    getPlayerData({ data: { playerId: session.playerId } }).then(setData);
  }, []);

  const player = data?.success ? data.player : null;
  const weekTotal: number = data?.success ? data.weekTotal : 0;
  const weekCap: number = data?.success ? data.weekCap : 50;
  const drawExecutesAt: string | undefined = data?.success
    ? data.drawWeek?.drawExecutesAt
    : undefined;

  const handleLogout = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <TopBar backTo="/" title="Profile" />
      <div className="px-4 pb-8 space-y-5">

        {/* ── Identity + Rank hero ───────────────────────────── */}
        <IdentityHero
          nickname={player?.nickname ?? session?.nickname ?? "Player"}
          msisdnLast4={player?.msisdnLast4 ?? session?.msisdnLast4 ?? "0000"}
          xp={player?.xpTotal ?? 0}
          tier={(player?.rankTier as RankTier) ?? "starter"}
        />

        {/* ── Weekly entries (primary stat) ───────────────────── */}
        <WeeklyEntriesCard
          weekTotal={weekTotal}
          weekCap={weekCap}
          drawExecutesAt={drawExecutesAt}
        />

        {/* ── Secondary stats: coins + streak ─────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-1 border border-border p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-coin" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Coins</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors -m-1 p-1" aria-label="About coins">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-64 text-xs leading-relaxed">
                  <span className="font-semibold text-foreground">Coins</span> are earned from sessions and from overflow when you've already hit the 50-entry weekly draw limit. Spend them on hints during gameplay — different hint types cost different amounts.
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {player?.coinBalance?.toLocaleString() ?? "0"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Spendable balance</p>
          </div>
          <StreakTile streak={player?.currentStreak ?? 0} />
        </div>

        {/* ── My activity ─────────────────────────────────────── */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
            My activity
          </h3>
          <div className="rounded-2xl bg-surface-1 border border-border overflow-hidden">
            <Link
              to="/entries"
              className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="text-sm font-medium">My Entries</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-foreground">{weekTotal}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link
              to="/winners"
              className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-coin/10 flex items-center justify-center">
                  <Award className="h-4.5 w-4.5 text-coin" />
                </div>
                <span className="text-sm font-medium">Recent Winners</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* ── How entries work (collapsible) ──────────────────── */}
        <Accordion type="single" collapsible className="rounded-2xl bg-surface-1 border border-border px-5">
          <AccordionItem value="how-entries" className="border-0">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline py-4">
              How entries work
            </AccordionTrigger>
            <AccordionContent className="pb-5 pt-1">
              <ol className="space-y-3.5">
                {[
                  { lead: "Solve to earn", body: "Every 5 puzzles you solve in a session earns 1 weekly draw entry." },
                  { lead: "Streak bonuses", body: "Day 3 adds +1 per session, day 7 adds +2, day 14 adds +3." },
                  { lead: "Mission rewards", body: "Complete missions for bonus entries on top." },
                  { lead: "Weekly draw", body: "Entries reset Monday. Draw is Sunday 20:00 WAT — more entries, better odds." },
                ].map((rule, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center tabular-nums">
                      {i + 1}
                    </span>
                    <div className="flex-1 -mt-0.5">
                      <p className="text-sm font-medium text-foreground">{rule.lead}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{rule.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* ── Logout (quiet, bottom) ──────────────────────────── */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Identity + rank merged hero ──────────────────────────────────────
function IdentityHero({
  nickname,
  msisdnLast4: _msisdnLast4,
  xp,
  tier,
}: {
  nickname: string;
  msisdnLast4: string;
  xp: number;
  tier: RankTier;
}) {
  const config = RANK_CONFIG[tier] ?? RANK_CONFIG.starter;

  const RANK_ORDER: RankTier[] = [
    "starter", "recruit", "sergeant", "veteran", "champion", "icon", "legend", "immortal",
  ];
  const idx = RANK_ORDER.indexOf(tier);
  const next = idx >= 0 && idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
  const nextConfig = next ? RANK_CONFIG[next] : null;
  const isMax = !next;

  const currentMin = config.minXp;
  const nextMin = nextConfig ? nextConfig.minXp : config.minXp;
  const progress = isMax
    ? 100
    : Math.min(100, Math.max(0, ((xp - currentMin) / (nextMin - currentMin)) * 100));

  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="relative mb-5">
        <div className="h-20 w-20 rounded-full bg-surface-2 flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <span
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full ring-2 ring-background text-[10px] font-semibold uppercase tracking-wide ${config.bgColor} ${config.color} ${
            config.glow ? "shadow-glow" : ""
          }`}
        >
          {config.label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mb-3">
        <h2 className="text-lg font-bold truncate max-w-[260px]">{nickname}</h2>
        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {!isMax && (
        <div className="w-full max-w-[240px] h-1.5 rounded-full bg-surface-2 overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground tabular-nums">
        {isMax
          ? "Maximum rank reached"
          : `${(nextConfig!.minXp - xp).toLocaleString()} XP to unlock ${nextConfig!.label}`}
      </p>
    </div>
  );
}

// ── Weekly entries primary card ──────────────────────────────────────
function WeeklyEntriesCard({
  weekTotal,
  weekCap,
  drawExecutesAt,
}: {
  weekTotal: number;
  weekCap: number;
  drawExecutesAt: string | undefined;
}) {
  const targetMs = drawExecutesAt
    ? new Date(drawExecutesAt).getTime()
    : getNextSundayWAT().getTime();

  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(() => force(), 60_000);
    return () => clearInterval(id);
  }, []);

  const countdown = formatCountdown(targetMs);
  const progress = Math.min(100, (weekTotal / weekCap) * 100);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-surface-1 to-surface-1 border border-primary/20 p-5 shadow-card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">This week</p>
          <p className="text-3xl font-bold tabular-nums mt-1">
            {weekTotal} <span className="text-lg text-muted-foreground font-medium">/ {weekCap} entries</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-2 px-2.5 py-1.5 rounded-lg">
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums">Draw in {countdown}</span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Link
        to="/"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
      >
        Play to earn more
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Streak tile (shows current bonus value) ──────────────────────────
function StreakTile({ streak }: { streak: number }) {
  const bonus = streakBonus(streak);
  const nextMilestone = streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : null;

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className={`h-4 w-4 ${streak > 0 ? "text-streak" : "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Streak</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors -m-1 p-1" aria-label="About streaks">
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 text-xs leading-relaxed">
            Your <span className="font-semibold text-foreground">streak</span> counts consecutive days you've played. Reach Day 3 for +1 bonus weekly draw entry per session, Day 7 for +2, Day 14 for +3. Miss a day and it resets to zero.
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-2xl font-bold tabular-nums">
        {streak > 0 ? `Day ${streak}` : "—"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {bonus > 0
          ? `+${bonus} bonus / session`
          : nextMilestone
            ? `${nextMilestone - streak}d to bonus`
            : "Play daily to earn bonuses"}
      </p>
    </div>
  );
}
