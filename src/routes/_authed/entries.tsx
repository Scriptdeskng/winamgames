import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { ChevronDown, Ticket, Swords, BookOpen, Flame } from "lucide-react";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import { getSession } from "@/lib/session";
import { getPlayerEntries, type PlayerEntryWeek, type TicketSource } from "@/utils/entries.functions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import React from "react";

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
      <TopBar backTo="/app" title="My Tickets" />
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
  const [open, setOpen] = React.useState(false);
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
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-3">
              <FlatTicketList tickets={week.tickets} />
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
              <FlatTicketList tickets={week.tickets} />
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function FlatTicketList({ tickets }: { tickets: { ticketId: string; source: TicketSource; earnedAt: string }[] }) {
  return (
    <div className="rounded-lg bg-surface-2/60 divide-y divide-border/40">
      {tickets.map((t) => {
        const meta = SOURCE_META[t.source];
        const Icon = meta.Icon;
        return (
          <div
            key={t.ticketId}
            className="flex items-center justify-between px-3 py-2 gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon className={`h-3.5 w-3.5 shrink-0 ${meta.color}`} />
              <span className="text-xs font-mono tabular-nums text-foreground truncate">
                {t.ticketId}
              </span>
              <span
                className={`shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium ${meta.color}`}
              >
                {meta.label}
              </span>
            </div>
            <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
              {new Date(t.earnedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
