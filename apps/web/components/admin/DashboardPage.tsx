"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Gamepad2,
  Info,
  Loader2,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAdminDashboardStats, requireAdminSession } from "@/lib/api";

interface DashboardStats {
  totalPlayers: number;
  sessionsThisWeek: number;
  currentWeekEntries: number;
  sessionsToday: number;
  currentWeek: {
    status: string;
    week_start_wat: string;
    week_end_wat: string;
    entry_lock_at: string;
    total_entries: number;
  } | null;
}

interface AnalyticsRow {
  date: string;
  totalSessions: number;
  checkmtSessions: number;
  wisdomSessions: number;
  uniquePlayers: number;
  tickets: number;
}

interface CompletionStats {
  completed: number;
  lives_out: number;
  exited: number;
  total: number;
}

type Period = "7d" | "30d" | "all";

function formatWeekRange(startWat: string, endWat: string): string {
  const start = new Date(startWat.slice(0, 10));
  const end = new Date(endWat.slice(0, 10));
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
}

function formatLockAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
};

const TOP_STAT_CARDS = [
  {
    label: "Total players",
    key: "totalPlayers" as const,
    icon: Users,
    tooltip: "Total registered player accounts",
  },
  {
    label: "Sessions this week",
    key: "sessionsThisWeek" as const,
    icon: Gamepad2,
    tooltip: "Game sessions completed in the current draw week",
  },
  {
    label: "Current week tickets",
    key: "currentWeekEntries" as const,
    icon: Ticket,
    tooltip: "Total draw tickets earned this week",
  },
  {
    label: "Sessions today",
    key: "sessionsToday" as const,
    icon: Gamepad2,
    tooltip: "Game sessions completed today (WAT)",
  },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsRows, setAnalyticsRows] = useState<AnalyticsRow[]>([]);
  const [completionStats, setCompletionStats] = useState<CompletionStats | null>(
    null,
  );
  const [period, setPeriod] = useState<Period>("7d");
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadStats() {
    try {
      const admin = await requireAdminSession();
      const data = await getAdminDashboardStats(admin.adminId);
      const recentSessions = (data.recentSessions ?? []) as Array<{
        completed_at: string | null;
        game_type: string;
        player_id: string;
        entries_awarded: number;
        completion_reason?: string;
      }>;
      const currentWeek = (data.currentWeek ?? null) as DashboardStats["currentWeek"];

      setStats({
        totalPlayers: Number(data.totalPlayers ?? 0),
        sessionsThisWeek: recentSessions.length,
        currentWeekEntries: Number(data.currentWeekEntries ?? 0),
        sessionsToday: Number(data.sessionsToday ?? 0),
        currentWeek: currentWeek
          ? {
              status: String(currentWeek.status),
              week_start_wat: String(currentWeek.week_start_wat),
              week_end_wat: String(currentWeek.week_end_wat),
              entry_lock_at: String(currentWeek.entry_lock_at),
              total_entries: Number(currentWeek.total_entries ?? 0),
            }
          : null,
      });
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalytics(p: Period) {
    void p;
    setAnalyticsLoading(true);
    try {
      const admin = await requireAdminSession();
      const data = await getAdminDashboardStats(admin.adminId);
      const sessions = (data.recentSessions ?? []) as Array<{
        completed_at: string | null;
        game_type: string;
        player_id: string;
        entries_awarded: number;
        completion_reason?: string;
      }>;

      const byDate = new Map<
        string,
        {
          total: number;
          checkmate: number;
          wisdom: number;
          players: Set<string>;
          tickets: number;
        }
      >();

      for (const s of sessions) {
        const date = (s.completed_at ?? new Date().toISOString()).slice(0, 10);
        if (!byDate.has(date)) {
          byDate.set(date, {
            total: 0,
            checkmate: 0,
            wisdom: 0,
            players: new Set(),
            tickets: 0,
          });
        }
        const d = byDate.get(date)!;
        d.total++;
        if (s.game_type === "checkmate") d.checkmate++;
        if (s.game_type === "wisdomdrop") d.wisdom++;
        if (s.player_id) d.players.add(s.player_id);
        d.tickets += s.entries_awarded ?? 0;
      }

      const rows: AnalyticsRow[] = Array.from(byDate.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => ({
          date,
          totalSessions: d.total,
          checkmtSessions: d.checkmate,
          wisdomSessions: d.wisdom,
          uniquePlayers: d.players.size,
          tickets: d.tickets,
        }));

      setAnalyticsRows(rows);

      const comp: CompletionStats = {
        completed: 0,
        lives_out: 0,
        exited: 0,
        total: sessions.length,
      };
      for (const s of sessions) {
        if (s.completion_reason === "completed") comp.completed++;
        else if (s.completion_reason === "lives_out") comp.lives_out++;
        else if (s.completion_reason === "exited") comp.exited++;
      }
      setCompletionStats(comp);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
    void loadAnalytics("7d");
    const interval = setInterval(() => void loadStats(), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void loadAnalytics(period);
  }, [period]);

  const analyticsSummary = useMemo(() => {
    const totalSessions = analyticsRows.reduce((a, r) => a + r.totalSessions, 0);
    const totalCheckmate = analyticsRows.reduce((a, r) => a + r.checkmtSessions, 0);
    const totalWisdom = analyticsRows.reduce((a, r) => a + r.wisdomSessions, 0);
    const totalTickets = analyticsRows.reduce((a, r) => a + r.tickets, 0);
    const uniquePlayers = analyticsRows.reduce((a, r) => a + r.uniquePlayers, 0);
    return { totalSessions, totalCheckmate, totalWisdom, totalTickets, uniquePlayers };
  }, [analyticsRows]);

  const hasChartData = analyticsRows.length >= 2;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Auto-refreshes every 60s.
        </p>
      </div>

      {err && <p className="text-sm text-destructive">{err}</p>}

      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {TOP_STAT_CARDS.map(({ label, key, icon: Icon, tooltip }) => (
            <div
              key={key}
              className="rounded-xl border border-border bg-surface-1 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="group/tip relative inline-flex cursor-help">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-48 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-[10px] leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100">
                      {tooltip}
                    </span>
                  </span>
                </div>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {stats[key].toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <h2 className="mb-3 text-sm font-semibold">Current draw week</h2>
        {stats?.currentWeek ? (
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium capitalize">{stats.currentWeek.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Week range</dt>
              <dd className="text-right font-medium">
                {formatWeekRange(
                  stats.currentWeek.week_start_wat,
                  stats.currentWeek.week_end_wat,
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Lock at</dt>
              <dd className="text-right font-medium">
                {formatLockAt(stats.currentWeek.entry_lock_at)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Total tickets</dt>
              <dd className="font-medium tabular-nums">
                {stats.currentWeek.total_entries.toLocaleString()}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-xs text-muted-foreground">No open draw week.</p>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface-1 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Player analytics</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sessions, players and tickets over time
            </p>
          </div>
          <div className="flex gap-1">
            {(["7d", "30d", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={
                  period === p
                    ? "rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    : "rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-surface-2"
                }
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="rounded-lg border border-border bg-surface-2/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Total sessions
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {analyticsSummary.totalSessions.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-2/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Unique players
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {analyticsSummary.uniquePlayers.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-2/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Tickets earned
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {analyticsSummary.totalTickets.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-2/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              CheckMate
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {analyticsSummary.totalCheckmate.toLocaleString()} (
              {pct(analyticsSummary.totalCheckmate, analyticsSummary.totalSessions)})
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-2/40 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              WisdomDrop
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {analyticsSummary.totalWisdom.toLocaleString()} (
              {pct(analyticsSummary.totalWisdom, analyticsSummary.totalSessions)})
            </p>
          </div>
        </div>

        {completionStats && (
          <div className="flex flex-wrap gap-3 border-t border-border/40 pt-2">
            <p className="mr-2 text-xs font-medium text-muted-foreground">
              Completion:
            </p>
            {completionStats.total === 0 ? (
              <span className="text-xs text-muted-foreground">
                No completion data yet
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  {pct(completionStats.completed, completionStats.total)} completed
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  {pct(completionStats.lives_out, completionStats.total)} lives out
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {pct(completionStats.exited, completionStats.total)} exited
                </span>
              </>
            )}
            <p className="ml-auto text-xs text-muted-foreground">
              {completionStats.total} total sessions
            </p>
          </div>
        )}

        {analyticsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasChartData ? (
          <div className="py-8 text-center">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Chart available after 2+ days of data
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep the platform running — trends will appear here
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={analyticsRows}
              margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(d: string) => d.slice(5)}
                stroke="transparent"
              />
              <YAxis tick={{ fontSize: 10 }} stroke="transparent" />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="totalSessions"
                name="Total sessions"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="checkmtSessions"
                name="CheckMate"
                stroke="oklch(0.65 0.22 290)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
              />
              <Line
                type="monotone"
                dataKey="wisdomSessions"
                name="WisdomDrop"
                stroke="oklch(0.75 0.15 85)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 2"
              />
              <Line
                type="monotone"
                dataKey="uniquePlayers"
                name="Unique players"
                stroke="oklch(0.55 0.05 55)"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="tickets"
                name="Tickets"
                stroke="oklch(0.82 0.17 85)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
