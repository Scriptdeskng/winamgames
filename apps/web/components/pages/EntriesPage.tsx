"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Ticket, Swords, BookOpen, Flame, ArrowLeft } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPlayerEntries } from "@/lib/api";
import { sessionStore } from "@/lib/session";

// ── Types ─────────────────────────────────────────────────────────────

interface TicketRow {
  id: string;
  source: string;
  created_at: string;
}

interface WeekData {
  drawWeekId: string;
  weekStartWat: string;
  weekEndWat: string;
  status: string;
  tickets: TicketRow[];
  totalTickets: number;
}

// ── Helpers ───────────────────────────────────────────────────────────

function formatWeekRange(startWat: string, endWat: string): string {
  const start = new Date(startWat);
  const end = new Date(endWat);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

function ticketIdFor(id: string, index: number): string {
  const compact = id.replace(/-/g, "").toUpperCase();
  const base = compact.slice(0, 6);
  const suffix = String(index + 1).padStart(2, "0");
  return `WG-${base}-${suffix}`;
}

const SOURCE_META: Record<string, { label: string; Icon: typeof Swords; color: string }> = {
  game_session: { label: "Puzzle", Icon: Swords, color: "text-primary" },
  gameplay: { label: "Puzzle", Icon: Swords, color: "text-primary" },
  mission: { label: "Mission", Icon: BookOpen, color: "text-[oklch(0.75_0.15_85)]" },
  streak: { label: "Streak", Icon: Flame, color: "text-[oklch(0.72_0.18_45)]" },
  streak_bonus: { label: "Streak", Icon: Flame, color: "text-[oklch(0.7_0.18_30)]" },
};

// ── Main page ─────────────────────────────────────────────────────────

export default function EntriesPage() {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<WeekData[] | null>(null);
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
      const result = await getPlayerEntries(pid!);
      setWeeks(result.weeks.map((week) => ({
        drawWeekId: week.drawWeekId,
        weekStartWat: week.weekStartWat,
        weekEndWat: week.weekEndWat,
        status: week.status,
        tickets: week.tickets.map((ticket) => ({
          id: ticket.id,
          source: ticket.source,
          created_at: ticket.created_at,
        })),
        totalTickets: week.totalTickets,
      })));
    }
    void load();
  }, [playerId]);

  if (!weeks) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentWeek = weeks.find((w) => w.status === "open") ?? null;
  const pastWeeks = weeks.filter((w) => w.status !== "open");

  const weekStartIndexes = new Map<string, number>();
  let runningIndex = 0;
  for (const w of weeks) {
    weekStartIndexes.set(w.drawWeekId, runningIndex);
    runningIndex += w.totalTickets;
  }

  return (
    <div className="mx-auto h-[100dvh] max-w-[430px] bg-background flex flex-col">
      <div className="flex items-center h-14 px-4 relative shrink-0">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="absolute left-4 h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <p className="w-full text-center text-base font-semibold text-foreground">My Tickets</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5 pt-2 scrollbar-hidden">
        {currentWeek ? (
          <CurrentWeekTickets
            week={currentWeek}
            weekCap={weekCap}
            startIndex={weekStartIndexes.get(currentWeek.drawWeekId) ?? 0}
          />
        ) : (
          <EmptyCurrentWeek />
        )}

        {pastWeeks.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Past Weeks
            </h2>
            <div className="space-y-2">
              {pastWeeks.map((w) => (
                <PastWeekCard
                  key={w.drawWeekId}
                  week={w}
                  startIndex={weekStartIndexes.get(w.drawWeekId) ?? 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Current week ──────────────────────────────────────────────────────

function CurrentWeekTickets({ week, weekCap, startIndex = 0 }: { week: WeekData; weekCap: number; startIndex?: number }) {
  const [open, setOpen] = useState(false);
  const pct = Math.min(100, (week.totalTickets / weekCap) * 100);
  const hasTickets = week.tickets.length > 0;

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4 space-y-4 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">This Week</p>
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
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-surface-2/60 px-3 py-2 hover:bg-surface-2 transition-colors">
            <span className="text-xs font-medium text-foreground">
              View tickets <span className="text-muted-foreground tabular-nums">· {week.totalTickets}</span>
            </span>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-3">
              <FlatTicketList tickets={week.tickets} startIndex={startIndex} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center">
          <Ticket className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">
            No tickets yet — play a game to earn your first one.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Empty current week ────────────────────────────────────────────────

function EmptyCurrentWeek() {
  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-6 text-center space-y-2">
      <Ticket className="h-6 w-6 text-muted-foreground mx-auto" />
      <p className="text-sm font-medium">No active draw week</p>
      <p className="text-xs text-muted-foreground">Check back soon for the next draw.</p>
    </div>
  );
}

// ── Past week card ────────────────────────────────────────────────────

function PastWeekCard({ week, startIndex = 0 }: { week: WeekData; startIndex?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl bg-surface-1 border border-border overflow-hidden">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-1/80 transition-colors">
          <div className="flex items-center gap-2.5 text-left">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{formatWeekRange(week.weekStartWat, week.weekEndWat)}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {week.totalTickets} {week.totalTickets === 1 ? "ticket" : "tickets"}
              </p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-border px-4 pb-4 pt-3">
            {week.tickets.length > 0 ? (
              <FlatTicketList tickets={week.tickets} startIndex={startIndex} />
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">No tickets earned this week.</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ── Flat ticket list ──────────────────────────────────────────────────

function FlatTicketList({ tickets, startIndex = 0 }: { tickets: TicketRow[]; startIndex?: number }) {
  return (
    <div className="rounded-lg bg-surface-2/60 divide-y divide-border/40">
      {tickets.map((t, index) => {
        const meta = SOURCE_META[t.source] ?? SOURCE_META.gameplay;
        const Icon = meta.Icon;
        return (
          <div key={t.id} className="flex items-center justify-between px-3 py-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
              <span className="text-xs font-mono tabular-nums text-foreground truncate">
                {ticketIdFor(t.id, startIndex + index)}
              </span>
              <span className={`shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
              {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
