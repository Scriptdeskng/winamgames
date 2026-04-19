import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { ChevronDown, Ticket, Swords, BookOpen, Flame, Hash } from "lucide-react";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import { getSession } from "@/lib/session";
import { getPlayerEntries, type PlayerEntryWeek, type TicketSource } from "@/utils/entries.functions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

type SortMode = "by-source" | "recent" | "oldest";

export const Route = createFileRoute("/_authed/entries")({
  component: EntriesPage,
  head: () => ({
    meta: [
      { title: "My Tickets — WinamGames" },
      { name: "description", content: "View your weekly draw tickets." },
    ],
  }),
});

function formatWeekRange(startWat: string, endWat: string): string {
  // Inputs are YYYY-MM-DD WAT dates
  const start = new Date(`${startWat}T00:00:00`);
  const end = new Date(`${endWat}T00:00:00`);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

const SOURCE_META: Record<TicketSource, { label: string; Icon: typeof Swords; color: string }> = {
  game_session: { label: "Puzzle", Icon: Swords, color: "text-primary" },
  mission: { label: "Mission", Icon: BookOpen, color: "text-[oklch(0.75_0.15_85)]" },
  streak_bonus: { label: "Streak", Icon: Flame, color: "text-[oklch(0.7_0.18_30)]" },
};

function EntriesPage() {
  useAllowScroll();
  const session = getSession();
  const [data, setData] = React.useState<{
    weeks: PlayerEntryWeek[];
    weekCap: number;
  } | null>(null);

  React.useEffect(() => {
    if (!session) return;
    getPlayerEntries({ data: { playerId: session.playerId } }).then((res) => {
      if (res.success) setData({ weeks: res.weeks, weekCap: res.weekCap });
      else setData({ weeks: [], weekCap: 50 });
    });
  }, []);

  if (!data) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentWeek = data.weeks.find((w) => w.status === "open") ?? null;
  const pastWeeks = data.weeks.filter((w) => w.status !== "open");

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <TopBar backTo="/" title="My Tickets" />
      <div className="px-4 pb-6 space-y-5">
        {currentWeek ? (
          <CurrentWeekTickets week={currentWeek} weekCap={data.weekCap} />
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
                <PastWeekCard key={w.drawWeekId} week={w} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CurrentWeekTickets({ week, weekCap }: { week: PlayerEntryWeek; weekCap: number }) {
  const pct = Math.min(100, (week.totalTickets / weekCap) * 100);
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

      {week.tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-center">
          <Ticket className="h-5 w-5 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">
            No tickets yet — play a game to earn your first one.
          </p>
        </div>
      ) : (
        <TicketGroupedList tickets={week.tickets} />
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

function PastWeekCard({ week }: { week: PlayerEntryWeek }) {
  const [open, setOpen] = React.useState(false);
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
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4">
            {week.tickets.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No tickets earned this week.</p>
            ) : (
              <TicketGroupedList tickets={week.tickets} />
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function TicketGroupedList({ tickets }: { tickets: { ticketId: string; source: TicketSource; earnedAt: string }[] }) {
  // Group by source so the list reads as: Puzzle (n) > id, id, id; Mission (n) > ...
  const groups = new Map<TicketSource, typeof tickets>();
  for (const t of tickets) {
    const arr = groups.get(t.source) ?? [];
    arr.push(t);
    groups.set(t.source, arr);
  }
  const order: TicketSource[] = ["game_session", "mission", "streak_bonus"];

  return (
    <div className="space-y-3">
      {order
        .filter((s) => groups.has(s))
        .map((source) => {
          const items = groups.get(source)!;
          const meta = SOURCE_META[source];
          const Icon = meta.Icon;
          return (
            <div key={source} className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className={`h-3 w-3 ${meta.color}`} />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
                  {meta.label}
                </p>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  · {items.length}
                </span>
              </div>
              <div className="rounded-lg bg-surface-2/60 divide-y divide-border/40">
                {items.map((t) => (
                  <div
                    key={t.ticketId}
                    className="flex items-center justify-between px-3 py-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-mono tabular-nums text-foreground">
                        {t.ticketId}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(t.earnedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
