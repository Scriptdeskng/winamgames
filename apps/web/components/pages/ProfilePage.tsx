"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User, Coins, Flame, Ticket, Award, LogOut, ChevronRight,
  ArrowRight, Clock, Info, Pencil, Check, X, Loader2, HelpCircle,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { getRankTierFromXp, RANK_CONFIG, type RankTier } from "@/components/profile/RankBadge";
import { getPlayerDashboard, logoutPlayer, updatePlayerNickname } from "@/lib/api";
import { sessionStore } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────

function getNextSundayWAT(): Date {
  const now = new Date();
  const target = new Date(now);
  const dayUTC = now.getUTCDay();
  let daysUntil = (7 - dayUTC) % 7;
  target.setUTCHours(19, 0, 0, 0);
  if (daysUntil === 0 && now.getTime() >= target.getTime()) daysUntil = 7;
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

interface PlayerData {
  id: string;
  nickname: string;
  rank: string;
  xp: number;
  coins: number;
  streak: number;
}

// ── Main page ─────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [weekTotal, setWeekTotal] = useState(0);
  const weekCap = 50;

  useEffect(() => {
    const session = sessionStore.get();
    if (!session?.player.id) { router.push("/login"); return; }
    setPlayerId(session.player.id);
  }, [router]);

  useEffect(() => {
    const pid = playerId;
    if (!pid) return;
    async function load() {
      const dashboard = await getPlayerDashboard(pid!);
      setPlayer({
        id: dashboard.player.id,
        nickname: dashboard.player.nickname,
        rank: dashboard.player.rank,
        xp: dashboard.player.xp,
        coins: dashboard.player.coins,
        streak: dashboard.player.streak,
      });
      setWeekTotal(dashboard.weekTotal);
    }
    void load();
  }, [playerId]);

  const handleLogout = useCallback(() => {
    void logoutPlayer()
      .catch(() => {
        // ignore logout errors
      })
      .finally(() => {
        sessionStore.clear();
        router.push("/login");
      });
  }, [router]);

  return (
    <div className="mx-auto h-[100dvh] max-w-[430px] bg-background flex flex-col">
      <div className="flex items-center h-14 px-4 relative shrink-0">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="absolute left-4 h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
        >
          <ArrowRight className="h-5 w-5 text-foreground rotate-180" />
        </button>
        <p className="w-full text-center text-base font-semibold text-foreground">Profile</p>
      </div>

      <div className="px-4 pb-8 space-y-5 pt-2 flex-1 overflow-y-auto scrollbar-hidden">
        <IdentityHero
          playerId={playerId ?? ""}
          nickname={player?.nickname ?? "Player"}
          xp={player?.xp ?? 0}
          tier={getRankTierFromXp(player?.xp ?? 0)}
          onNicknameUpdated={(nick) => setPlayer((p) => p ? { ...p, nickname: nick } : p)}
        />

        <WeeklyEntriesCard weekTotal={weekTotal} weekCap={weekCap} />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-surface-1 border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-coin" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Coins</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors -m-1 p-1" aria-label="About coins">
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-64 text-xs leading-relaxed">
                  Coins are earned from rounds and from overflow when you've already hit the 50-ticket weekly draw limit. Spend them on hints during gameplay — different hint types cost different amounts.
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-2xl font-bold tabular-nums">{(player?.coins ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Spendable balance</p>
          </div>
          <StreakTile streak={player?.streak ?? 0} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">My activity</h3>
          <div className="rounded-2xl bg-surface-1 border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => router.push("/entries")}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">My Tickets</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-foreground">{weekTotal}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => router.push("/winners")}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors border-b border-border"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-coin/10 flex items-center justify-center">
                  <Award className="h-4 w-4 text-coin" />
                </div>
                <span className="text-sm font-medium">Recent Winners</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/support")}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">Help & Support</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <AppearanceSection />

        <div className="pt-2">
          <button
            type="button"
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

// ── Appearance section ────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Appearance</h3>
      <div className="rounded-2xl bg-surface-1 border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              {mounted ? <Icon className="h-4 w-4 text-primary" /> : <div className="h-4 w-4" />}
            </div>
            <span className="text-sm font-medium">Dark mode</span>
          </div>
          <Switch
            checked={mounted ? isDark : true}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            aria-label="Toggle dark mode"
          />
        </div>
      </div>
    </div>
  );
}

// ── Identity hero ─────────────────────────────────────────────────────

function IdentityHero({
  playerId,
  nickname,
  xp,
  tier,
  onNicknameUpdated,
}: {
  playerId: string;
  nickname: string;
  xp: number;
  tier: RankTier;
  onNicknameUpdated: (nickname: string) => void;
}) {
  const config = RANK_CONFIG[tier] ?? RANK_CONFIG.starter;
  const RANK_ORDER: RankTier[] = ["starter", "recruit", "sergeant", "veteran", "champion", "icon", "legend", "immortal"];
  const idx = RANK_ORDER.indexOf(tier);
  const next = idx >= 0 && idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
  const nextConfig = next ? RANK_CONFIG[next] : null;
  const isMax = !next;
  const currentMin = config.minXp;
  const nextMin = nextConfig ? nextConfig.minXp : config.minXp;
  const progress = isMax ? 100 : Math.min(100, Math.max(0, ((xp - currentMin) / (nextMin - currentMin)) * 100));

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(nickname);
    setEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const cancelEdit = () => { if (!saving) { setEditing(false); setDraft(nickname); } };

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === nickname) { setEditing(false); return; }
    if (trimmed.length < 2 || trimmed.length > 20) return;
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) return;
    setSaving(true);
    try {
      await updatePlayerNickname(playerId, trimmed);
      onNicknameUpdated(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="relative mb-5">
        <div className="h-20 w-20 rounded-full bg-surface-2 flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <span className={cn(
          "absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full ring-2 ring-background text-[10px] font-semibold uppercase tracking-wide",
          config.bgColor, config.color, config.glow && "shadow-glow"
        )}>
          {config.label}
        </span>
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void save(); if (e.key === "Escape") cancelEdit(); }}
            disabled={saving}
            maxLength={20}
            className="text-lg font-bold text-center bg-surface-2 border border-border rounded-lg px-3 py-1 max-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          />
          <button type="button" onClick={() => void save()} disabled={saving} className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button type="button" onClick={cancelEdit} disabled={saving} className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-2 transition-colors disabled:opacity-60">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={startEdit} className="flex items-center gap-1.5 mb-3 group -mx-2 px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors">
          <h2 className="text-lg font-bold truncate max-w-[260px]">{nickname}</h2>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}

      <div className="w-full max-w-[240px] h-1.5 rounded-full bg-surface-2 overflow-hidden mb-1.5">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {isMax ? "Maximum rank reached" : `${(nextConfig!.minXp - xp).toLocaleString()} XP to unlock ${nextConfig!.label}`}
      </p>
    </div>
  );
}

// ── Weekly entries card ───────────────────────────────────────────────

function WeeklyEntriesCard({ weekTotal, weekCap }: { weekTotal: number; weekCap: number }) {
  const targetMs = getNextSundayWAT().getTime();
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  const progress = Math.min(100, (weekTotal / weekCap) * 100);
  const router = useRouter();

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-surface-1 to-surface-1 border border-primary/20 p-5 shadow-card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">This week</p>
          <p className="text-3xl font-bold tabular-nums mt-1">
            {weekTotal} <span className="text-lg text-muted-foreground font-medium">/ {weekCap} tickets</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-2 px-2.5 py-1.5 rounded-lg">
          <Clock className="h-3.5 w-3.5" />
          <span className="tabular-nums">Draw in {formatCountdown(targetMs)}</span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      <button
        type="button"
        onClick={() => router.push("/app")}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
      >
        Play to earn more
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Streak tile ───────────────────────────────────────────────────────

function StreakTile({ streak }: { streak: number }) {
  const bonus = streakBonus(streak);
  const nextMilestone = streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : null;

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className={cn("h-4 w-4", streak > 0 ? "text-streak" : "text-muted-foreground")} />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Streak</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors -m-1 p-1" aria-label="About streaks">
              <Info className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 text-xs leading-relaxed">
            Your streak counts consecutive days you've played. Reach Day 3 for +1 bonus ticket per round, Day 7 for +2, Day 14 for +3. Miss a day and it resets to zero.
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-2xl font-bold tabular-nums">{streak > 0 ? `Day ${streak}` : "—"}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {bonus > 0 ? `+${bonus} bonus / round` : nextMilestone ? `${nextMilestone - streak}d to bonus` : "Play daily to earn bonuses"}
      </p>
    </div>
  );
}
