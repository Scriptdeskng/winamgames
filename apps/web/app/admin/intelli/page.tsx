"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Loader2, RefreshCw } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session";
import { getIntelliEvents } from "@/lib/admin-api";

type IntelliEvent = {
  id: string;
  event_type: string;
  telco: string | null;
  action: string | null;
  msisdn: string | null;
  product_name: string | null;
  status: string | null;
  previous_status: string | null;
  new_status: string | null;
  changed_existing: boolean | null;
  auto_renewal: boolean | null;
  telco_ref: string | null;
  player_id: string | null;
  subscription_id: string | null;
  created_at: string | null;
  payload: Record<string, unknown>;
};

const FILTERS = [
  { key: "", label: "All events" },
  { key: "SYNC_NOTIFICATION", label: "Sync" },
  { key: "RENEWAL_NOTIFICATION", label: "Renewal" },
  { key: "UNSUBSCRIPTION_NOTIFICATION", label: "Unsubscription" },
] as const;

export default function AdminIntelliPage() {
  const adminId = getAdminSession()?.adminId ?? "";
  const [eventType, setEventType] = useState("");
  const [events, setEvents] = useState<IntelliEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const result = await getIntelliEvents(adminId, eventType, 1, 40);
      setEvents((result.events ?? []) as IntelliEvent[]);
      setTotal(Number(result.total ?? 0));
      setErr(null);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to load Intelli events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [adminId, eventType]);

  const summary = useMemo(() => {
    const counts = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
      return acc;
    }, {});
    return [
      { label: "Total", value: total },
      { label: "Sync", value: counts.SYNC_NOTIFICATION ?? 0 },
      { label: "Renewal", value: counts.RENEWAL_NOTIFICATION ?? 0 },
      { label: "Unsub", value: counts.UNSUBSCRIPTION_NOTIFICATION ?? 0 },
    ];
  }, [events, total]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-primary font-semibold">
            <Bell className="h-3.5 w-3.5" />
            Intelli events
          </div>
          <h1 className="mt-3 text-2xl font-bold">Subscription timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">Incoming OTP and subscription notifications from Intelli.</p>
        </div>
        <button
          onClick={() => load(true)}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-2 text-sm hover:bg-surface-2"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-surface-1 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-bold tabular-nums">{Number(item.value ?? 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = eventType === filter.key;
          return (
            <button
              key={filter.key || "all"}
              onClick={() => setEventType(filter.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${active ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"}`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface-1 py-10 text-center text-sm text-muted-foreground">
          No Intelli notifications captured yet.
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <details key={event.id} className="overflow-hidden rounded-xl border border-border bg-surface-1">
              <summary className="cursor-pointer list-none px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{event.event_type}</span>
                  <span className="text-sm font-medium">{event.product_name ?? "Unknown product"}</span>
                  <span className="text-xs text-muted-foreground">{event.msisdn ? `•••${event.msisdn.slice(-4)}` : "Unknown MSISDN"}</span>
                  <span className="text-xs text-muted-foreground">{event.created_at ? new Date(event.created_at).toLocaleString() : "Just now"}</span>
                </div>
              </summary>
              <div className="border-t border-border bg-surface-2/30 p-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <Meta label="Telco" value={event.telco ?? "—"} />
                  <Meta label="Action" value={event.action ?? "—"} />
                  <Meta label="Status" value={event.status ?? "—"} />
                  <Meta label="Before" value={event.previous_status ?? "—"} />
                  <Meta label="After" value={event.new_status ?? "—"} />
                  <Meta label="Existing record" value={event.changed_existing === null ? "—" : event.changed_existing ? "Yes" : "No"} />
                  <Meta label="Auto renewal" value={event.auto_renewal === null ? "—" : event.auto_renewal ? "Yes" : "No"} />
                  <Meta label="Telco ref" value={event.telco_ref ?? "—"} />
                  <Meta label="Player" value={event.player_id ?? "Unmatched"} />
                </div>
                <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
                  <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Raw payload</p>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-foreground">{JSON.stringify(event.payload, null, 2)}</pre>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium break-all">{value}</p>
    </div>
  );
}
