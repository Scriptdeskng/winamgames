"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, ChevronDown, Hash, Gamepad2, Trophy, ArrowLeft } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPublishedWinners } from "@/lib/api";
import { sessionStore } from "@/lib/session";

// ── Types ─────────────────────────────────────────────────────────────

interface WinnerRow {
  id: string;
  position: number;
  prizeType: string;
  prizeAmount: number;
  ticketId: string;
  nickname: string | null;
  msisdnLast4: string;
}

interface WeekEntry {
  week: {
    id: string;
    week_start_wat: string;
    week_end_wat: string;
  };
  winners: WinnerRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────

function maskName(nickname: string | null, last4: string) {
  if (nickname && nickname.length > 0) {
    const visible = nickname.slice(0, 2);
    return `${visible}***`;
  }
  return `***${last4}`;
}

function formatMoney(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function formatWeekLabel(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  return `${fmt(s, { month: "short", day: "numeric" })} – ${fmt(e, { month: "short", day: "numeric", year: "numeric" })}`;
}

function getNextSundayDrawDate(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntil = day === 0 ? 7 : 7 - day;
  const next = new Date(now);
  next.setUTCDate(now.getUTCDate() + daysUntil);
  return next.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

const POSITION_STYLES = [
  { bg: "bg-[oklch(0.75_0.15_85)]/15", text: "text-[oklch(0.75_0.15_85)]", label: "1st" },
  { bg: "bg-[oklch(0.65_0.01_250)]/15", text: "text-[oklch(0.65_0.01_250)]", label: "2nd" },
  { bg: "bg-[oklch(0.55_0.05_55)]/15", text: "text-[oklch(0.55_0.05_55)]", label: "3rd" },
];

// ── Main page ─────────────────────────────────────────────────────────

export default function WinnersPage() {
  const router = useRouter();
  const [weeks, setWeeks] = useState<WeekEntry[] | null>(null);

  useEffect(() => {
    const session = sessionStore.get();
    if (!session?.player.id) { router.push("/login"); return; }
  }, [router]);

  useEffect(() => {
    async function load() {
      const payload = await getPublishedWinners();
      const result: WeekEntry[] = payload.map((entry) => ({
        week: entry.week,
        winners: entry.winners.map((winner) => ({
          id: winner.id,
          position: winner.position,
          prizeType: winner.prizeType,
          prizeAmount: winner.prizeAmount,
          ticketId: winner.ticketId ?? winner.id,
          nickname: winner.nickname,
          msisdnLast4: winner.msisdnLast4,
        })),
      }));
      setWeeks(result);
    }
    void load();
  }, []);

  if (weeks === null) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="mx-auto h-[100dvh] max-w-[430px] bg-background flex flex-col">
        <div className="flex items-center h-14 px-4 relative shrink-0">
          <button type="button" onClick={() => router.push("/app")} className="absolute left-4 h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/40 transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <p className="w-full text-center text-base font-semibold text-foreground">Winners</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" aria-hidden />
            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-b from-primary/25 to-primary/10 border border-primary/30 shadow-glow flex items-center justify-center">
              <Trophy className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">No draws yet</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-[300px] leading-relaxed">
            The first draw happens this Sunday at 20:00 WAT. Play now to earn your tickets.
          </p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 tabular-nums">
            Next draw · Sunday {getNextSundayDrawDate()} at 20:00 WAT
          </p>
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="mt-8 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-glow"
          >
            <Gamepad2 className="h-4 w-4" />
            Start playing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto h-[100dvh] max-w-[430px] bg-background flex flex-col">
      <div className="flex items-center h-14 px-4 relative shrink-0">
        <button type="button" onClick={() => router.push("/app")} className="absolute left-4 h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/40 transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <p className="w-full text-center text-base font-semibold text-foreground">Winners</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 pt-2 scrollbar-hidden">
        <div className="relative overflow-hidden rounded-2xl bg-surface-1 border border-border p-5 shadow-card text-center space-y-2">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent" />
          <Award className="relative h-8 w-8 text-primary mx-auto" />
          <h1 className="relative text-xl font-bold">Real people. Real wins.</h1>
          <p className="relative text-xs text-muted-foreground">Winners every week — cash, airtime &amp; data</p>
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="relative inline-flex items-center gap-2 mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Gamepad2 className="h-4 w-4" />
            Play Now
          </button>
        </div>

        {weeks.map((entry, i) => (
          <WinnersList
            key={entry.week.id}
            weekLabel={formatWeekLabel(entry.week.week_start_wat, entry.week.week_end_wat)}
            winners={entry.winners}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </div>
  );
}

// ── Winners list ──────────────────────────────────────────────────────

function WinnersList({ weekLabel, winners, defaultOpen }: { weekLabel: string; winners: WinnerRow[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cashWinners = winners.filter((w) => w.prizeType === "cash").sort((a, b) => a.position - b.position);
  const nonCash = winners.filter((w) => w.prizeType !== "cash");

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl bg-surface-1 border border-border overflow-hidden">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-1/80 transition-colors">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold">{weekLabel}</p>
              <p className="text-[10px] text-muted-foreground">{winners.length} winners</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {cashWinners.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">Cash Prizes</p>
                {cashWinners.map((w, j) => {
                  const style = POSITION_STYLES[w.position - 1] ?? POSITION_STYLES[2];
                  return (
                    <div key={w.id} className={`flex items-center justify-between py-2 ${j < cashWinners.length - 1 ? "border-b border-border/40" : ""}`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-7 rounded-full ${style.bg} flex items-center justify-center text-[10px] font-bold ${style.text}`}>
                          {style.label}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{w.nickname ?? "Anonymous"}</span>
                          <span className="text-[9px] text-muted-foreground tabular-nums flex items-center gap-0.5">
                            <Hash className="h-2 w-2" />{w.ticketId.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-primary">{formatMoney(w.prizeAmount)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {nonCash.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2.5">
                <span className="text-xs font-semibold text-foreground">
                  + {nonCash.length}{" "}airtime &amp; data prize winners
                </span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
