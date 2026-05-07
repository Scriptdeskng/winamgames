"use client";

import { useEffect, useState } from "react";
import { Bell, Loader2, Users, CreditCard, Ticket, Gamepad2, Info } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session";
import { getDashboardStats } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const session = getAdminSession();
    if (!session) return;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await getDashboardStats(session.adminId);
        if (!cancelled) setStats(response);
        if (!cancelled) setErr(null);
      } catch (error) {
        if (!cancelled) setErr(error instanceof Error ? error.message : "Failed to load dashboard");
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!stats) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const cards = [
    { label: "Total players", value: stats.totalPlayers, icon: Users, tooltip: "Total registered players" },
    { label: "Active subscriptions", value: stats.activeSubscriptions, icon: CreditCard, tooltip: "Players with active subscriptions" },
    { label: "Current week tickets", value: stats.currentWeekEntries, icon: Ticket, tooltip: "Tickets earned in current week" },
    { label: "Sessions today", value: stats.sessionsToday, icon: Gamepad2, tooltip: "Completed sessions today" },
    { label: "Intelli events", value: stats.intelliEventsTotal, icon: Bell, tooltip: "Incoming subscription events from Intelli" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Auto-refreshes every 60s.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl bg-surface-1 border border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <span className="group relative inline-flex">
                  <Info className="h-3 w-3 text-muted-foreground/70" />
                  <span className="pointer-events-none absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover px-2 py-1.5 text-xs leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {card.tooltip}
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-2xl font-bold tabular-nums">{Number(card.value ?? 0).toLocaleString()}</p>
                <Icon className="h-4 w-4 text-primary" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl bg-surface-1 border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">Current draw week</h2>
          {stats.currentWeek ? (
            <dl className="space-y-1.5 text-xs">
              <Row label="Status" value={stats.currentWeek.status} />
              <Row label="Week" value={`${stats.currentWeek.week_start_wat} → ${stats.currentWeek.week_end_wat}`} />
              <Row label="Lock at" value={new Date(stats.currentWeek.entry_lock_at).toLocaleString()} />
              <Row label="Tickets" value={String(stats.currentWeek.total_entries)} />
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">No open draw week.</p>
          )}
        </div>
        <div className="rounded-xl bg-surface-1 border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">Recent sessions</h2>
          <ul className="space-y-1.5 text-xs">
            {stats.recentSessions?.length ? stats.recentSessions.map((s: any) => (
              <li key={s.id} className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0">
                <span>{s.player?.nickname ?? `***${s.player?.msisdn_last4 ?? "----"}`} · {s.game_type}</span>
                <span className="tabular-nums text-muted-foreground">+{s.entries_awarded}</span>
              </li>
            )) : <li className="text-muted-foreground">No sessions yet.</li>}
          </ul>
        </div>
        <div className="rounded-xl bg-surface-1 border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">Recent Intelli events</h2>
          <ul className="space-y-1.5 text-xs">
            {stats.recentIntelliEvents?.length ? stats.recentIntelliEvents.map((event: any) => (
              <li key={event.id} className="flex items-center justify-between border-b border-border/40 pb-1.5 last:border-0">
                <span className="truncate pr-3">{event.event_type} · {event.product_name ?? "Subscription"}</span>
                <span className="tabular-nums text-muted-foreground">{event.msisdn ? `***${String(event.msisdn).slice(-4)}` : "—"}</span>
              </li>
            )) : <li className="text-muted-foreground">No Intelli events yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
