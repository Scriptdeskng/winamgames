"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  ChevronDown,
  Circle,
  Coins,
  Clock,
  Flame,
  Info,
  LogOut,
  Medal,
  Moon,
  Pencil,
  ShieldCheck,
  Sun,
  Ticket,
  User,
  X,
  Zap,
  BadgeCheck,
  Crown,
  Gem,
} from "lucide-react";
import { clearSession, getSession, updateSessionNickname } from "@/lib/session";
import { getProfile, setNickname } from "@/lib/api";
import type { WinamSession } from "@/lib/session";

type RankTier = "starter" | "recruit" | "sergeant" | "veteran" | "champion" | "icon" | "legend" | "immortal";

const RANK_CONFIG: Record<
  RankTier,
  { label: string; minXp: number; bg: string; color: string; glow?: boolean; Icon: typeof Circle }
> = {
  starter: { label: "Starter", minXp: 0, bg: "bg-surface-2", color: "text-muted-foreground", Icon: Circle },
  recruit: { label: "Recruit", minXp: 100, bg: "bg-primary/10", color: "text-primary", Icon: BadgeCheck },
  sergeant: { label: "Sergeant", minXp: 250, bg: "bg-coin/10", color: "text-coin", Icon: Medal },
  veteran: { label: "Veteran", minXp: 500, bg: "bg-xp/10", color: "text-xp", Icon: Zap },
  champion: { label: "Champion", minXp: 900, bg: "bg-streak/10", color: "text-streak", Icon: Crown },
  icon: { label: "Icon", minXp: 1500, bg: "bg-emerald/10", color: "text-emerald", glow: true, Icon: Gem },
  legend: { label: "Legend", minXp: 3000, bg: "bg-emerald/15", color: "text-emerald", glow: true, Icon: Crown },
  immortal: { label: "Immortal", minXp: 5000, bg: "bg-gold/15", color: "text-gold", glow: true, Icon: Crown },
};

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

function getCountdownParts(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

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

function streakBonus(streak: number): number {
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1;
  return 0;
}

function rankIconForTier(tier: RankTier) {
  return RANK_CONFIG[tier]?.Icon ?? Circle;
}

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<WinamSession | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = getSession();
    setSession(stored);
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    setLoadingData(true);
    getProfile(session.playerId)
      .then((result) => {
        setProfile(result);
      })
      .catch(() => {
        setProfile(null);
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [ready, router, session]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    localStorage.setItem("winam-theme", next);
  };

  const logout = () => {
    clearSession();
    router.push("/login");
  };

  const dashboard = profile?.dashboard ?? null;
  const kyc = profile?.kyc ?? null;
  const player = dashboard?.player ?? {};
  const weekTotal = dashboard?.weekTotal ?? 0;
  const weekCap = dashboard?.weekCap ?? 50;
  const drawExecutesAt = dashboard?.drawWeek?.drawExecutesAt;
  const xp = player.xpTotal ?? 0;
  const rankTier = (player.rankTier ?? "starter") as RankTier;
  const rankConfig = RANK_CONFIG[rankTier] ?? RANK_CONFIG.starter;

  const rankOrder: RankTier[] = ["starter", "recruit", "sergeant", "veteran", "champion", "icon", "legend", "immortal"];
  const rankIndex = rankOrder.indexOf(rankTier);
  const nextTier = rankIndex >= 0 && rankIndex < rankOrder.length - 1 ? rankOrder[rankIndex + 1] : null;
  const nextConfig = nextTier ? RANK_CONFIG[nextTier] : null;
  const isMax = !nextConfig;
  const progress = isMax ? 100 : Math.min(100, Math.max(0, ((xp - rankConfig.minXp) / (nextConfig!.minXp - rankConfig.minXp)) * 100));

  const countdownTarget = drawExecutesAt ? new Date(drawExecutesAt).getTime() : getNextSundayWAT().getTime();
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((x) => x + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const countdown = formatCountdown(countdownTarget);
  const bonus = streakBonus(player.currentStreak ?? 0);
  const hasBank = !!kyc?.bank_details_submitted_at;
  const last4 = kyc?.account_number ? String(kyc.account_number).slice(-4) : "";
  const fullName = [kyc?.first_name, kyc?.last_name].filter(Boolean).join(" ").trim() || "Verified player";
  const idType = kyc?.id_type ? String(kyc.id_type).toUpperCase() : "—";
  const dob = kyc?.dob ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${kyc.dob}T00:00:00`)) : "—";

  if (!ready || !session) return null;

  if (loadingData && !profile) {
    return <ProfileSkeleton onBack={() => router.push("/app")} />;
  }

  const safeProfile = profile ?? {};
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Link href="/app" className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="flex-1 px-2 text-center text-base font-bold text-foreground truncate">Profile</span>
          <div className="h-10 w-10" aria-hidden />
        </div>

        <div className="px-4 pb-8 space-y-5">
          <IdentityHero
            nickname={session.nickname ?? "Player"}
            rankConfig={rankConfig}
            rankTier={rankTier}
            xp={xp}
            progress={progress}
            isMax={isMax}
            nextLabel={nextConfig?.label ?? ""}
            nextXp={nextConfig?.minXp ?? 0}
            onRename={async (nickname) => {
              const result = await setNickname(session.playerId, nickname);
              if (result.success) {
                updateSessionNickname(nickname);
                setSession((current) => (current ? { ...current, nickname } : current));
              }
            }}
          />

          <WeeklyEntriesCard weekTotal={weekTotal} weekCap={weekCap} drawExecutesAt={drawExecutesAt} bonus={bonus} />

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              icon={Coins}
              label="Coins"
              value={String(player.coinBalance ?? 0)}
              tone="coin"
              tooltip="Coins are earned when your weekly ticket cap is full, or through select mission rewards."
              subtext="Available balance"
            />
            <StatTile
              icon={Flame}
              label="Streak"
              value={player.currentStreak ? `Day ${player.currentStreak}` : "—"}
              tone="streak"
              tooltip="Daily streaks add bonus tickets to every round as you keep playing."
              subtext="Keep your chain alive"
            />
          </div>

          <VerificationSection
            kyc={safeProfile.kyc ?? kyc}
            fullName={fullName}
            idType={idType}
            dob={dob}
            hasBank={hasBank}
            last4={last4}
            nickname={session.nickname ?? "Player"}
            msisdnLast4={player.msisdnLast4 ?? "----"}
            rankTier={rankTier}
          />

          <ActivitySection />

          <TicketsInfoSection />

          <AppearanceSection theme={theme} onToggle={toggleTheme} />

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}

function ProfileSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <button onClick={onBack} className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="flex-1 px-2 text-center text-base font-bold text-foreground truncate">Profile</span>
          <div className="h-10 w-10" aria-hidden />
        </div>

        <div className="px-4 pb-8 space-y-5">
          <div className="rounded-[28px] bg-surface-1 border border-border p-4 shadow-card animate-pulse">
            <div className="h-4 w-24 rounded-full bg-surface-2" />
            <div className="mt-4 h-10 w-40 rounded-2xl bg-surface-2" />
            <div className="mt-3 h-3 w-28 rounded-full bg-surface-2" />
            <div className="mt-4 h-2.5 w-full rounded-full bg-surface-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card animate-pulse">
              <div className="h-4 w-10 rounded-full bg-surface-2" />
              <div className="mt-5 h-8 w-16 rounded-full bg-surface-2" />
              <div className="mt-2 h-3 w-20 rounded-full bg-surface-2" />
            </div>
            <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card animate-pulse">
              <div className="h-4 w-12 rounded-full bg-surface-2" />
              <div className="mt-5 h-8 w-16 rounded-full bg-surface-2" />
              <div className="mt-2 h-3 w-20 rounded-full bg-surface-2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-5 w-32 rounded-full bg-surface-2 animate-pulse" />
            <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card animate-pulse">
              <div className="h-4 w-40 rounded-full bg-surface-2" />
              <div className="mt-2 h-3 w-56 rounded-full bg-surface-2" />
            </div>
            <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card animate-pulse">
              <div className="h-4 w-36 rounded-full bg-surface-2" />
              <div className="mt-2 h-3 w-48 rounded-full bg-surface-2" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function IdentityHero({
  nickname,
  rankConfig,
  rankTier,
  xp,
  progress,
  isMax,
  nextLabel,
  nextXp,
  onRename,
}: {
  nickname: string;
  rankConfig: { label: string; minXp: number; bg: string; color: string; glow?: boolean };
  rankTier: RankTier;
  xp: number;
  progress: number;
  isMax: boolean;
  nextLabel: string;
  nextXp: number;
  onRename: (nickname: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(nickname);
  }, [nickname]);

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed.length < 2 || trimmed.length > 20) return;
    setSaving(true);
    try {
      await onRename(trimmed);
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
        <div className={`absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background ${rankConfig.color}`}>
          {(() => {
            const RankIcon = rankIconForTier(rankTier);
            return <RankIcon className="h-4 w-4" />;
          })()}
        </div>
        <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full ring-2 ring-background text-[10px] font-semibold uppercase tracking-wide ${rankConfig.bg} ${rankConfig.color} ${rankConfig.glow ? "shadow-glow" : ""}`}>
          {rankConfig.label}
        </span>
      </div>

      {editing ? (
        <div className="flex items-center gap-1.5 mb-3">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="text-lg font-bold text-center bg-surface-2 border border-border rounded-lg px-3 py-1 max-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Edit nickname"
            maxLength={20}
          />
          <button onClick={save} disabled={saving} className="p-1.5 rounded-md text-primary hover:bg-primary/10 transition-colors disabled:opacity-60" aria-label="Save nickname">
            {saving ? <Clock className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button onClick={() => setEditing(false)} className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-2 transition-colors" aria-label="Cancel edit">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 mb-3 group -mx-2 px-2 py-1 rounded-lg hover:bg-surface-2 transition-colors" aria-label="Edit nickname">
          <h2 className="text-lg font-bold truncate max-w-[260px]">{nickname}</h2>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}

      {!isMax && (
        <div className="w-full max-w-[240px] h-1.5 rounded-full bg-surface-2 overflow-hidden mb-1.5">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      <p className="text-xs text-muted-foreground tabular-nums">
        {isMax ? "Maximum rank reached" : `${(nextXp - xp).toLocaleString()} XP to unlock ${nextLabel}`}
      </p>
    </div>
  );
}

function WeeklyEntriesCard({
  weekTotal,
  weekCap,
  drawExecutesAt,
  bonus,
}: {
  weekTotal: number;
  weekCap: number;
  drawExecutesAt?: string;
  bonus: number;
}) {
  const targetMs = drawExecutesAt ? new Date(drawExecutesAt).getTime() : getNextSundayWAT().getTime();
  const countdown = formatCountdown(targetMs);
  const countdownParts = getCountdownParts(targetMs);
  const progress = Math.min(100, (weekTotal / weekCap) * 100);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/12 via-surface-1 to-surface-1 border border-primary/20 p-4 shadow-card space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Weekly draw</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-foreground leading-none">
            {String(countdownParts.days).padStart(2, "0")}<span className="px-1 text-muted-foreground">:</span>
            {String(countdownParts.hours).padStart(2, "0")}<span className="px-1 text-muted-foreground">:</span>
            {String(countdownParts.minutes).padStart(2, "0")}<span className="px-1 text-muted-foreground">:</span>
            {String(countdownParts.seconds).padStart(2, "0")}
          </p>
          <div className="mt-1 flex items-center gap-6 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
            <span>day</span>
            <span>hr</span>
            <span>min</span>
            <span>sec</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-muted-foreground">This week</p>
          <p className="text-foreground">
            <span className="text-primary text-2xl font-black tabular-nums">{weekTotal}</span>
            <span className="text-sm text-muted-foreground font-medium"> / {weekCap} tickets</span>
          </p>
        </div>
      </div>

      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="space-y-0.5">
          <p>Draw every Sunday at 20:00 WAT</p>
          <p className="tabular-nums">{countdown}</p>
        </div>
        <Link href="/entries" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
          View my tickets
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface-1/70 p-3 shadow-sm">
        <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-streak/10">
            <Flame className="h-4.5 w-4.5 text-streak" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">7-day streak bonus</p>
            <p className="text-xs text-muted-foreground">
              Play 7 days in a row to earn {bonus > 0 ? `${bonus} extra ticket${bonus > 1 ? "s" : ""}` : "2 extra tickets"} per round
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  tooltip,
  subtext,
}: {
  icon: any;
  label: string;
  value: string;
  tone: "coin" | "streak";
  tooltip: string;
  subtext: string;
}) {
  const toneClass = tone === "coin" ? "bg-coin/10 text-coin" : "bg-streak/10 text-streak";
  const [showTip, setShowTip] = useState(false);
  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${tone === "coin" ? "text-coin" : "text-streak"}`} />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTip((open) => !open)}
            onBlur={() => setShowTip(false)}
            className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label={`More information about ${label}`}
            aria-expanded={showTip}
            title={tooltip}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          {showTip && (
            <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-border bg-popover px-3 py-2 text-left text-[11px] leading-snug text-popover-foreground shadow-lg">
              {tooltip}
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-2xl font-black tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
}

function VerificationSection({
  kyc,
  fullName,
  idType,
  dob,
  hasBank,
  last4,
  nickname,
  msisdnLast4,
  rankTier,
}: {
  kyc: any;
  fullName: string;
  idType: string;
  dob: string;
  hasBank: boolean;
  last4: string;
  nickname: string;
  msisdnLast4: string;
  rankTier: RankTier;
}) {
  const identitySubmitted = !!kyc?.submitted_at;
  const bankSubmitted = !!kyc?.bank_details_submitted_at;

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verification</h3>
      <div className="rounded-2xl border border-border bg-surface-1 p-4 shadow-card space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{nickname}</p>
              <p className="text-xs text-muted-foreground">***{msisdnLast4}</p>
            </div>
          </div>
          <div
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              kyc?.verified ? "border border-success/30 bg-success/10 text-success" : "border border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            {kyc?.verified && <Check className="h-3 w-3" />}
            {kyc?.verified ? "Verified" : identitySubmitted ? "In review" : "Not started"}
          </div>
        </div>
        <div className="flex justify-center -mt-1">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background ${(RANK_CONFIG[rankTier] ?? RANK_CONFIG.starter).color}`}>
            {(() => {
              const RankIcon = rankIconForTier(rankTier);
              return <RankIcon className="h-4 w-4" />;
            })()}
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-surface-2/40 p-3">
          <VerificationRow label="Bio" value={nickname} />
          <VerificationRow label="Phone" value={`***${msisdnLast4}`} />
          <VerificationRow label="Full name" value={fullName} />
          <VerificationRow label="ID type" value={idType} />
          <VerificationRow label="Date of birth" value={dob} />
          <VerificationRow
            label="Bank"
            value={bankSubmitted ? `${kyc.bank_name ?? "—"} ${last4 ? `••••${last4}` : ""}`.trim() : "Add your bank details"}
          />
          <VerificationRow label="Status" value={hasBank ? "Bank details saved" : "Identity only"} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/kyc?step=1" className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:border-primary/30 transition-colors">
            Update other details
          </Link>
          <Link href="/kyc?step=2" className="inline-flex flex-1 items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-foreground hover:bg-primary/90 transition-colors">
            {hasBank ? "Update bank details" : "Add bank details"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerificationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="truncate text-right text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ActivitySection() {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">My activity</h3>
      <div className="rounded-2xl bg-surface-1 border border-border overflow-hidden">
        <Link href="/entries" className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Ticket className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-sm font-medium">My Tickets</span>
          </div>
          <div className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
          </div>
        </Link>
        <Link href="/winners" className="flex items-center justify-between p-4 hover:bg-surface-2 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-coin/10 flex items-center justify-center">
              <Award className="h-4.5 w-4.5 text-coin" />
            </div>
            <span className="text-sm font-medium">Recent Winners</span>
          </div>
          <ChevronDown className="h-4 w-4 -rotate-90 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

function TicketsInfoSection() {
  return (
    <details className="rounded-2xl bg-surface-1 border border-border px-5">
      <summary className="cursor-pointer list-none py-4 text-sm font-semibold hover:no-underline">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p>Tickets &amp; the weekly draw</p>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">How to earn tickets and win cash</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
        </div>
      </summary>
      <div className="pb-5 pt-1">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Every Sunday at 20:00 WAT we run a cash draw. <span className="font-semibold text-foreground">Tickets are your shot at the draw</span> - the more you collect during the week, the better your odds of winning. Earn them by playing; once the draw runs, your ticket count resets and a new week begins.
        </p>
        <ol className="space-y-3.5">
          {[
            { lead: "Solve puzzles to earn tickets", body: "Every 5 puzzles you solve in a round earns 1 ticket for Sunday's draw." },
            { lead: "Daily streaks earn extra tickets", body: "Play every day to build a streak. Each round earns bonus draw tickets: +1 from day 3, +2 from day 7, +3 from day 14." },
            { lead: "Missions add bonus tickets", body: "Completing daily missions awards extra tickets on top of what you earn from play." },
            { lead: "Weekly cap & reset", body: "You can collect up to 50 tickets per week. Anything beyond that converts to coins. The draw runs every Sunday at 20:00 WAT - right after, tickets reset and the next week begins." },
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
      </div>
    </details>
  );
}

function AppearanceSection({ theme, onToggle }: { theme: "dark" | "light"; onToggle: () => void }) {
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Appearance</h3>
      <div className="rounded-2xl bg-surface-1 border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <span className="text-sm font-medium">{theme === "dark" ? "Dark mode" : "Light mode"}</span>
          </div>
          <button
            onClick={onToggle}
            className="relative inline-flex h-7 w-12 items-center rounded-full border border-border bg-surface-2 px-0.5 transition-colors"
            aria-label="Toggle dark mode"
          >
            <span className={`h-6 w-6 rounded-full bg-primary transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
