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
  Coins,
  Clock,
  Flame,
  Info,
  LogOut,
  Moon,
  Pencil,
  ShieldCheck,
  Sun,
  Ticket,
  User,
  X,
} from "lucide-react";
import { clearSession, getSession, updateSessionNickname } from "@/lib/session";
import { getProfile, setNickname } from "@/lib/api";
import type { WinamSession } from "@/lib/session";

type RankTier = "starter" | "recruit" | "sergeant" | "veteran" | "champion" | "icon" | "legend" | "immortal";

const RANK_CONFIG: Record<RankTier, { label: string; minXp: number; bg: string; color: string; glow?: boolean }> = {
  starter: { label: "Starter", minXp: 0, bg: "bg-surface-2", color: "text-muted-foreground" },
  recruit: { label: "Recruit", minXp: 100, bg: "bg-primary/10", color: "text-primary" },
  sergeant: { label: "Sergeant", minXp: 250, bg: "bg-coin/10", color: "text-coin" },
  veteran: { label: "Veteran", minXp: 500, bg: "bg-xp/10", color: "text-xp" },
  champion: { label: "Champion", minXp: 900, bg: "bg-streak/10", color: "text-streak" },
  icon: { label: "Icon", minXp: 1500, bg: "bg-emerald/10", color: "text-emerald", glow: true },
  legend: { label: "Legend", minXp: 3000, bg: "bg-emerald/15", color: "text-emerald", glow: true },
  immortal: { label: "Immortal", minXp: 5000, bg: "bg-gold/15", color: "text-gold", glow: true },
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
  }, [router, session]);

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
          <button
            onClick={toggleTheme}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface-1 px-3 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-primary" /> : <Moon className="h-4 w-4 text-primary" />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>

        <div className="px-4 pb-8 space-y-5">
          <IdentityHero
            nickname={session.nickname ?? "Player"}
            rankConfig={rankConfig}
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

          <WeeklyEntriesCard weekTotal={weekTotal} weekCap={weekCap} drawExecutesAt={drawExecutesAt} />

          <div className="grid grid-cols-2 gap-3">
            <StatTile icon={Coins} label="Coins" value={String(player.coinBalance ?? 0)} tone="coin" />
            <StatTile icon={Flame} label="Streak" value={player.currentStreak ? `Day ${player.currentStreak}` : "—"} tone="streak" />
          </div>

          <VerificationSection
            kyc={safeProfile.kyc ?? kyc}
            fullName={fullName}
            idType={idType}
            dob={dob}
            hasBank={hasBank}
            last4={last4}
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
  xp,
  progress,
  isMax,
  nextLabel,
  nextXp,
  onRename,
}: {
  nickname: string;
  rankConfig: { label: string; minXp: number; bg: string; color: string; glow?: boolean };
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

function WeeklyEntriesCard({ weekTotal, weekCap, drawExecutesAt }: { weekTotal: number; weekCap: number; drawExecutesAt?: string }) {
  const targetMs = drawExecutesAt ? new Date(drawExecutesAt).getTime() : getNextSundayWAT().getTime();
  const countdown = formatCountdown(targetMs);
  const progress = Math.min(100, (weekTotal / weekCap) * 100);

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
          <span className="tabular-nums">Draw in {countdown}</span>
        </div>
      </div>

      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <Link href="/app" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">
        Play to earn more
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: "coin" | "streak" }) {
  const toneClass = tone === "coin" ? "bg-coin/10 text-coin" : "bg-streak/10 text-streak";
  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${tone === "coin" ? "text-coin" : "text-streak"}`} />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}>
        {value}
      </div>
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
}: {
  kyc: any;
  fullName: string;
  idType: string;
  dob: string;
  hasBank: boolean;
  last4: string;
}) {
  if (!kyc?.submitted_at) return null;

  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verification</h3>
      <details className="group rounded-2xl border border-border bg-surface-1 p-4">
        <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-semibold">{fullName}</p>
              {kyc.verified && (
                <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                  Verified
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{hasBank ? "Identity verified" : "Identity verified - bank details needed"}</p>
            {hasBank && <p className="mt-1 truncate text-xs text-muted-foreground">{kyc.bank_name} ••••{last4}</p>}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-4 border-t border-border pt-4 text-sm">
          <div className="grid gap-3">
            <VerificationRow label="ID type" value={idType} />
            <VerificationRow label="Date of birth" value={dob} />
            {hasBank && (
              <>
                <VerificationRow label="Bank" value={kyc.bank_name ?? "—"} />
                <VerificationRow label="Account number" value={last4 ? `••••${last4}` : "—"} />
              </>
            )}
          </div>
          <Link href="/kyc?step=2" className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline">
            {hasBank ? "Update bank details" : "Add bank details"}
          </Link>
        </div>
      </details>
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
        <div>
          <p>Tickets &amp; the weekly draw</p>
          <p className="text-xs font-normal text-muted-foreground mt-0.5">How to earn tickets and win cash</p>
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
            <span className="text-sm font-medium">Dark mode</span>
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
