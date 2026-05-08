"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, Flame, Swords, Ticket } from "lucide-react";
import { getMyWinnerStatus, getPlayerEntries } from "@/lib/api";
import { getSession } from "@/lib/session";
import { PlayerTopBar } from "@/components/player-top-bar";

type TicketSource = "game_session" | "mission" | "streak" | "streak_bonus";

const SOURCE_META: Record<TicketSource, { label: string; Icon: any; color: string }> = {
  game_session: { label: "Puzzle", Icon: Swords, color: "text-primary" },
  mission: { label: "Mission", Icon: BookOpen, color: "text-[oklch(0.75_0.15_85)]" },
  streak: { label: "Streak", Icon: Flame, color: "text-[oklch(0.72_0.18_45)]" },
  streak_bonus: { label: "Streak", Icon: Flame, color: "text-[oklch(0.7_0.18_30)]" },
};

function formatWeekRange(startWat: string, endWat: string): string {
  const start = new Date(`${startWat}T00:00:00`);
  const end = new Date(`${endWat}T00:00:00`);
  const fmt = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

export default function EntriesPage() {
  const router = useRouter();
  const session = getSession();
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<any>(null);
  const [winnerStatus, setWinnerStatus] = useState<any>(null);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    Promise.all([getPlayerEntries(session.playerId), getMyWinnerStatus(session.playerId)])
      .then(([entriesRes, winnerRes]) => {
        if (cancelled) return;
        setData(entriesRes?.success ? entriesRes : { success: false, weeks: [], weekCap: 50 });
        setWinnerStatus(winnerRes);
      })
      .catch(() => {
        if (cancelled) return;
        setData({ success: false, weeks: [], weekCap: 50 });
        setWinnerStatus(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [router, session]);

  if (!ready || !session) return null;

  if (!data) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  const weeks = data.weeks ?? [];
  const currentWeek = weeks.find((w: any) => w.status === "open") ?? null;
  const pastWeeks = weeks.filter((w: any) => w.status !== "open");

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
        <PlayerTopBar backTo="/app" title="My Tickets" />

        <div className="px-4 pb-6 space-y-5">
          {currentWeek ? (
            <CurrentWeekTickets week={currentWeek} weekCap={data.weekCap ?? 50} winnerStatus={winnerStatus} />
          ) : (
            <EmptyCurrentWeek />
          )}

          {pastWeeks.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Past Weeks
              </h2>
              <div className="space-y-2">
                {pastWeeks.map((w: any) => (
                  <PastWeekCard key={w.drawWeekId} week={w} winnerStatus={winnerStatus} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function CurrentWeekTickets({ week, weekCap, winnerStatus }: { week: any; weekCap: number; winnerStatus: any }) {
  const [open, setOpen] = useState(false);
  const pct = Math.min(100, (week.totalTickets / weekCap) * 100);
  const hasTickets = week.tickets.length > 0;

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4 space-y-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">This Week</p>
          <WinnerBadge week={week} winnerStatus={winnerStatus} />
        </div>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {formatWeekRange(week.weekStartWat, week.weekEndWat)}
        </p>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold tabular-nums text-primary">{week.totalTickets}</p>
          <p className="text-sm text-muted-foreground tabular-nums">/ {weekCap} tickets</p>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {hasTickets ? (
        <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary className="flex items-center justify-between rounded-lg bg-surface-2/60 px-3 py-2 hover:bg-surface-2 transition-colors list-none cursor-pointer">
            <span className="text-xs font-medium text-foreground">
              View tickets <span className="text-muted-foreground tabular-nums">· {week.totalTickets}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </summary>
          <div className="pt-3">
            <FlatTicketList tickets={week.tickets} />
          </div>
        </details>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center">
          <Ticket className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">No tickets yet - play a game to earn your first one.</p>
        </div>
      )}
    </div>
  );
}

function EmptyCurrentWeek() {
  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-6 text-center space-y-2">
      <Ticket className="h-6 w-6 text-muted-foreground mx-auto" />
      <p className="text-sm font-medium">No active draw week</p>
      <p className="text-xs text-muted-foreground">Check back soon for the next draw.</p>
    </div>
  );
}

function PastWeekCard({ week, winnerStatus }: { week: any; winnerStatus: any }) {
  const [open, setOpen] = useState(false);

  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)} className="rounded-2xl bg-surface-1 border border-border overflow-hidden shadow-card">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
        <div className="text-left">
          <p className="text-sm font-medium">{formatWeekRange(week.weekStartWat, week.weekEndWat)}</p>
          <WinnerBadge week={week} winnerStatus={winnerStatus} />
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {week.totalTickets} {week.totalTickets === 1 ? "ticket" : "tickets"}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </summary>
      <div className="px-4 pb-4 space-y-2">
        {week.tickets?.length ? week.tickets.map((ticket: any) => {
          const meta = SOURCE_META[ticket.source as TicketSource];
          const Icon = meta.Icon;
          return (
            <div key={ticket.ticketId} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
                <span className="text-xs font-mono tabular-nums text-foreground truncate">{ticket.ticketId}</span>
                <span className={`shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                {new Date(ticket.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          );
        }) : <p className="text-xs text-muted-foreground py-2">No tickets earned this week.</p>}
      </div>
    </details>
  );
}

function WinnerBadge({ week, winnerStatus }: { week: any; winnerStatus: any }) {
  if (!winnerStatus?.won || winnerStatus.drawWeekId !== week.drawWeekId) return null;
  const amount = `₦${winnerStatus.prizeAmount.toLocaleString("en-NG")}`;
  if (winnerStatus.prizeType === "airtime") {
    return (
      <span className="mt-1 inline-flex w-fit rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
        🎉 {amount} airtime
      </span>
    );
  }
  const complete = !!winnerStatus.kyc?.identitySubmitted && !!winnerStatus.kyc?.bankSubmitted;
  const paid = !!winnerStatus.kyc?.paymentProcessed;
  const label = paid ? "Paid" : complete ? "Claimed" : "Claim required";
  const className = "mt-1 inline-flex w-fit rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold";

  if (complete || paid) {
    return <span className={className}>🏆 {amount} — {label}</span>;
  }

  return (
    <Link href="/kyc" className={`${className} hover:bg-gold/20`}>
      🏆 {amount} — {label}
    </Link>
  );
}

function FlatTicketList({ tickets }: { tickets: { ticketId: string; source: TicketSource; earnedAt: string }[] }) {
  return (
    <div className="rounded-lg bg-surface-2/60 divide-y divide-border/40">
      {tickets.map((t) => {
        const meta = SOURCE_META[t.source];
        const Icon = meta.Icon;
        return (
          <div key={t.ticketId} className="flex items-center justify-between px-3 py-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
              <span className="text-xs font-mono tabular-nums text-foreground truncate">{t.ticketId}</span>
              <span className={`shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}>{meta.label}</span>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
              {new Date(t.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
