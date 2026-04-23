import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminSession } from "@/utils/admin.auth";
import { getDashboardStats } from "@/utils/admin.functions";
import { Users, CreditCard, Ticket, Gamepad2, Info } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) return;
    let cancelled = false;
    const load = async () => {
      try {
        const s = await getDashboardStats({ data: { adminId: session.adminId } });
        if (!cancelled) setStats(s);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load");
      }
    };
    load();
    const i = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, []);

  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!stats) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const cards = [
    {
      label: "Total players",
      value: stats.totalPlayers,
      icon: Users,
      tooltip: "Total registered player accounts across all time",
    },
    {
      label: "Active subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      tooltip:
        "Players with a currently active subscription (note: prototype auto-renews on login, so this may be inflated)",
    },
    {
      label: "Current week tickets",
      value: stats.currentWeekEntries,
      icon: Ticket,
      tooltip: "Total draw tickets earned by all players in the current open draw week",
    },
    {
      label: "Sessions today",
      value: stats.sessionsToday,
      icon: Gamepad2,
      tooltip: "Number of completed game sessions today (WAT timezone)",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Auto-refreshes every 60s.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-xl bg-surface-1 border border-border p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <div className="flex items-center gap-1.5">
                  <span className="group relative inline-flex">
                    <Info className="h-3 w-3 cursor-help text-muted-foreground/70 hover:text-muted-foreground" />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover px-2 py-1.5 text-xs leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                    >
                      {c.tooltip}
                    </span>
                  </span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{c.value.toLocaleString()}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl bg-surface-1 border border-border p-4">
          <h2 className="text-sm font-semibold mb-3">Current draw week</h2>
          {stats.currentWeek ? (
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="font-medium uppercase">{stats.currentWeek.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Week</dt>
                <dd>{stats.currentWeek.week_start_wat} → {stats.currentWeek.week_end_wat}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Lock at</dt>
                <dd>{new Date(stats.currentWeek.entry_lock_at).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Total tickets</dt>
                <dd className="tabular-nums">{stats.currentWeek.total_entries}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">No open draw week.</p>
          )}
        </div>

        <div className="rounded-xl bg-surface-1 border border-border p-4">
          <h2 className="text-sm font-semibold mb-3">Recent sessions</h2>
          <ul className="space-y-1.5 text-xs">
            {stats.recentSessions.length === 0 && (
              <li className="text-muted-foreground">No sessions yet.</li>
            )}
            {stats.recentSessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0"
              >
                <span>
                  {s.player.nickname ?? `***${s.player.msisdn_last4}`} · {s.game_type}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  +{s.entries_awarded}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
