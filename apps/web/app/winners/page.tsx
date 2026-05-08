"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, ChevronDown, Gamepad2, Hash, Trophy } from "lucide-react";
import { getPublishedWinners } from "@/lib/api";
import { getSession } from "@/lib/session";
import { PlayerTopBar } from "@/components/player-top-bar";

type WinnerRow = {
  id: string;
  position: number;
  prizeType: string;
  prizeAmount: number;
  ticketId: string;
  nickname: string | null;
  msisdnLast4: string;
};

function formatWeekLabel(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameYear = s.getUTCFullYear() === e.getUTCFullYear();
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  if (sameYear) {
    return `${fmt(s, { month: "short", day: "numeric" })} – ${fmt(e, { month: "short", day: "numeric", year: "numeric" })}`;
  }
  return `${fmt(s, { month: "short", day: "numeric", year: "numeric" })} – ${fmt(e, { month: "short", day: "numeric", year: "numeric" })}`;
}

function maskName(nickname: string | null, last4: string) {
  if (nickname && nickname.length > 0) {
    return `${nickname.slice(0, 2)}***`;
  }
  return `***${last4}`;
}

function formatMoney(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function ordinalLabel(position: number) {
  if (position === 1) return "1st";
  if (position === 2) return "2nd";
  if (position === 3) return "3rd";
  return `${position}th`;
}

export default function WinnersPage() {
  const router = useRouter();
  const session = getSession();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }
    getPublishedWinners()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load winners."));
  }, [router, session]);

  if (!session) return null;
  if (!data && !error) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  const weeks = data?.weeks ?? [];
  const empty = weeks.length === 0;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-background text-foreground">
      <PlayerTopBar backTo="/app" title="Winners" />

      <div className="px-4 pb-6 space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-surface-1 border border-border p-5 shadow-card text-center space-y-2">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent" />
          <Award className="relative h-8 w-8 text-primary mx-auto" />
          <h1 className="relative text-xl font-bold">Real people. Real wins.</h1>
          <p className="relative text-xs text-muted-foreground">Winners every week - cash, airtime & data</p>
          <Link href="/app" className="relative inline-flex items-center gap-2 mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Gamepad2 className="h-4 w-4" />
            Play Now
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {empty ? (
          <div className="rounded-2xl bg-surface-1 border border-border p-6 shadow-card text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative mx-auto h-20 w-20 rounded-2xl bg-gradient-to-b from-primary/25 to-primary/10 border border-primary/30 shadow-glow flex items-center justify-center">
                <Trophy className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">No draws yet</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
              The first draw happens this Sunday at 20:00 WAT. Play now to earn your tickets.
            </p>
          </div>
        ) : (
          weeks.map((entry: any, index: number) => (
            <WinnersList
              key={entry.week.id}
              weekLabel={formatWeekLabel(entry.week.week_start_wat, entry.week.week_end_wat)}
              winners={entry.winners as WinnerRow[]}
              defaultOpen={index === 0}
            />
          ))
        )}
      </div>
    </main>
  );
}

function WinnersList({
  weekLabel,
  winners,
  defaultOpen,
}: {
  weekLabel: string;
  winners: WinnerRow[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cashWinners = winners
    .filter((w) => w.prizeType === "cash")
    .sort((a, b) => a.position - b.position);
  const nonCash = winners.filter((w) => w.prizeType !== "cash");

  const tierMap = useMemo(() => {
    const map = new Map<number, WinnerRow[]>();
    for (const w of nonCash) {
      const arr = map.get(w.prizeAmount) ?? [];
      arr.push(w);
      map.set(w.prizeAmount, arr);
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [nonCash]);

  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)} className="rounded-2xl bg-surface-1 border border-border overflow-hidden">
      <summary className="flex w-full items-center justify-between px-4 py-3 cursor-pointer list-none hover:bg-surface-1/80 transition-colors">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <div className="text-left">
            <p className="text-sm font-semibold">{weekLabel}</p>
            <p className="text-[10px] text-muted-foreground">{winners.length} winners</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </summary>

      <div className="px-4 pb-4 space-y-3">
        {cashWinners.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">Cash Prizes</p>
            {cashWinners.map((w, idx) => (
              <div
                key={w.id}
                className={`flex items-center justify-between py-2 ${idx < cashWinners.length - 1 ? "border-b border-border/40" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-[oklch(0.75_0.15_85)]/15 flex items-center justify-center text-[10px] font-bold text-[oklch(0.75_0.15_85)]">
                    {ordinalLabel(w.position)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium tabular-nums">{maskName(w.nickname, w.msisdnLast4)}</span>
                    <span className="text-[9px] text-muted-foreground tabular-nums flex items-center gap-0.5">
                      <Hash className="h-2 w-2" />
                      {w.ticketId.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary">{formatMoney(w.prizeAmount)}</span>
              </div>
            ))}
          </div>
        )}

        {tierMap.map(([amount, ws]) => (
          <details key={amount} className="group">
            <summary className="flex cursor-pointer items-center justify-between rounded-lg bg-surface-2/50 px-3 py-2 text-xs">
              <span className="font-semibold">
                {formatMoney(amount)} {ws[0].prizeType === "airtime" ? "Airtime" : "Data"}
              </span>
              <span className="text-muted-foreground">{ws.length} winners</span>
            </summary>
            <div className="mt-1.5 space-y-1 px-2">
              {ws.map((w) => (
                <div key={w.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-[11px] tabular-nums">{maskName(w.nickname, w.msisdnLast4)}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">#{w.ticketId.slice(0, 6).toUpperCase()}</span>
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}
