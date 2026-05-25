"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Loader2,
  Lock,
  Play,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  executeDrawWeek,
  getAdminDrawWinners,
  getAdminDraws,
  lockDrawWeek,
  requireAdminSession,
  publishDrawWeek,
  settleDrawWeek,
} from "@/lib/api";

interface DrawWeek {
  id: string;
  week_start_wat: string;
  week_end_wat: string;
  status: string;
  entry_lock_at: string | null;
  winners_published: boolean;
  created_at: string;
  total_tickets?: number;
  unique_players?: number;
}

interface Winner {
  id: string;
  draw_week_id: string;
  player_id: string | null;
  position: number;
  prize_type: string;
  prize_amount: number;
  payment_status: string;
  player?: { nickname: string | null; msisdn_last4: string | null };
}

type ModalType = "lock" | "execute" | "publish" | "settle" | null;

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  loading = false,
  disableConfirm = false,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  disableConfirm?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        disabled={loading}
        onClick={() => {
          if (!loading) onClose();
        }}
      />
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="h-9 rounded-md border border-border px-4 text-sm font-medium hover:bg-surface-2 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || disableConfirm}
            onClick={onConfirm}
            className={`h-9 rounded-md px-4 text-sm font-medium text-primary-foreground disabled:opacity-40 ${
              destructive
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {loading ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DrawPage() {
  const [weeks, setWeeks] = useState<DrawWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [executeConfirm, setExecuteConfirm] = useState("");
  const [winnersByWeek, setWinnersByWeek] = useState<
    Record<string, Winner[] | undefined>
  >({});
  const [openWeekId, setOpenWeekId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const admin = await requireAdminSession();
      const result = await getAdminDraws(admin.adminId);
      const merged: DrawWeek[] = ((result.weeks ?? []) as Array<Record<string, unknown>>).map((w) => {
        return {
          id: String(w.id),
          week_start_wat: String(w.week_start_wat),
          week_end_wat: String(w.week_end_wat),
          status: String(w.status),
          entry_lock_at: String(w.entry_lock_at ?? ""),
          winners_published: Boolean(w.winners_published ?? false),
          created_at: new Date().toISOString(),
          total_tickets: Number(w.total_tickets ?? 0),
          unique_players: Number(w.unique_players ?? 0),
        };
      });

      setWeeks(merged);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load draw weeks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const current = useMemo(
    () =>
      weeks.find((w) => w.status === "open" || w.status === "locked") ??
      weeks[0] ??
      null,
    [weeks],
  );

  async function loadWinners(weekId: string) {
    if (winnersByWeek[weekId] !== undefined) return;
    try {
      const admin = await requireAdminSession();
      const result = await getAdminDrawWinners(admin.adminId, weekId);
      const mapped: Winner[] = ((result.winners ?? []) as Array<Record<string, unknown>>).map((w) => ({
        id: String(w.id),
        draw_week_id: String(w.draw_week_id ?? weekId),
        player_id: (w.player_id as string | null) ?? null,
        position: Number(w.position ?? 0),
        prize_type: String(w.prize_type ?? "cash"),
        prize_amount: Number(w.prize_amount ?? 0),
        payment_status: String((w.payment as Record<string, unknown> | undefined)?.status ?? "pending"),
        player: w.player
          ? {
              nickname: (w.player as Record<string, unknown>).nickname as string | null,
              msisdn_last4: (w.player as Record<string, unknown>).msisdn_last4 as string | null,
            }
          : undefined,
      }));
      setWinnersByWeek((prev) => ({ ...prev, [weekId]: mapped }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load winners");
      setWinnersByWeek((prev) => ({ ...prev, [weekId]: [] }));
    }
  }

  function toggleWeek(weekId: string) {
    if (openWeekId === weekId) {
      setOpenWeekId(null);
      return;
    }
    setOpenWeekId(weekId);
    void loadWinners(weekId);
  }

  async function handleAction(action: "lock" | "execute" | "publish" | "settle") {
    setBusy(true);
    setErr(null);
    try {
      const admin = await requireAdminSession();
      if (action === "lock") await lockDrawWeek(admin.adminId);
      if (action === "execute") await executeDrawWeek(admin.adminId);
      if (action === "publish") await publishDrawWeek(admin.adminId);
      if (action === "settle") await settleDrawWeek(admin.adminId);
      const labels: Record<typeof action, string> = {
        lock: "Draw week locked.",
        execute: "Draw executed.",
        publish: "Winners published.",
        settle: "Week marked settled.",
      };
      setSuccess(labels[action]);
      setModal(null);
      setExecuteConfirm("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  function exportCsv(week: DrawWeek, winners: Winner[]) {
    const headers = [
      "position",
      "prize_type",
      "prize_amount",
      "player_id",
      "nickname",
      "msisdn_last4",
    ];
    const rows = winners.map((w) => [
      w.position,
      w.prize_type,
      w.prize_amount,
      w.player_id ?? "",
      w.player?.nickname ?? "",
      w.player?.msisdn_last4 ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `winners-${week.week_start_wat}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Draw management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lock, execute, publish and settle weekly draws.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-2 disabled:opacity-40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
          {success}
        </div>
      )}

      {current && (
        <div className="rounded-xl border border-border bg-surface-1 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Current week
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {current.week_start_wat.slice(0, 10)} → {current.week_end_wat.slice(0, 10)}
              </h2>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>
                  Status:{" "}
                  <span className="font-semibold capitalize text-foreground">
                    {current.status}
                  </span>
                </span>
                <span>
                  Tickets:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {current.total_tickets ?? 0}
                  </span>
                </span>
                <span>
                  Players:{" "}
                  <span className="font-semibold tabular-nums text-foreground">
                    {current.unique_players ?? 0}
                  </span>
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Lock at:{" "}
                {current.entry_lock_at
                  ? new Date(current.entry_lock_at).toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={current.status !== "open"}
              onClick={() => setModal("lock")}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              <Lock className="h-4 w-4" />
              Lock
            </button>
            <button
              type="button"
              disabled={current.status !== "locked"}
              onClick={() => setModal("execute")}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              Execute
            </button>
            <button
              type="button"
              disabled={current.status !== "drawn"}
              onClick={() => setModal("publish")}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Publish winners
            </button>
            <button
              type="button"
              disabled={current.status !== "drawn"}
              onClick={() => setModal("settle")}
              className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-2 disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" />
              Settle
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          History
        </h3>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Week</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Tickets</th>
                <th className="px-4 py-3 text-right font-medium">Players</th>
                <th className="px-4 py-3 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {weeks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-sm text-muted-foreground"
                  >
                    No draw weeks yet.
                  </td>
                </tr>
              ) : (
                weeks.map((w) => {
                  const isOpen = openWeekId === w.id;
                  const winners = winnersByWeek[w.id];
                  const winnersLoaded = winners !== undefined;

                  return (
                    <Fragment key={w.id}>
                      <tr
                        className="cursor-pointer border-t border-border hover:bg-surface-2/50"
                        onClick={() => toggleWeek(w.id)}
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1">
                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                            {w.week_start_wat.slice(0, 10)} → {w.week_end_wat.slice(0, 10)}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize">{w.status}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {w.total_tickets ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {w.unique_players ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {winnersLoaded && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportCsv(w, winners);
                              }}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              CSV
                            </button>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr
                          key={`${w.id}-expanded`}
                          className="border-t border-border bg-surface-2/30"
                        >
                          <td colSpan={5} className="px-3 py-3">
                            {!winnersLoaded ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              </div>
                            ) : winners.length === 0 ? (
                              <p className="text-center text-xs text-muted-foreground">
                                No winners for this week.
                              </p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead className="text-muted-foreground">
                                  <tr>
                                    <th className="py-1 text-left font-medium">
                                      #
                                    </th>
                                    <th className="py-1 text-left font-medium">
                                      Player
                                    </th>
                                    <th className="py-1 text-left font-medium">
                                      Prize
                                    </th>
                                    <th className="py-1 text-left font-medium">
                                      Payment
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {winners.map((winner) => (
                                    <tr
                                      key={winner.id}
                                      className="border-t border-border/50"
                                    >
                                      <td className="py-1.5 tabular-nums">
                                        {winner.position}
                                      </td>
                                      <td className="py-1.5">
                                        {winner.player?.nickname ?? "—"}{" "}
                                        <span className="text-muted-foreground">
                                          ***
                                          {winner.player?.msisdn_last4 ??
                                            "----"}
                                        </span>
                                      </td>
                                      <td className="py-1.5">
                                        {winner.prize_type} ₦
                                        {winner.prize_amount.toLocaleString()}
                                      </td>
                                      <td className="py-1.5 capitalize">
                                        {winner.payment_status}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={modal === "lock"}
        title="Lock current draw week?"
        description="No new tickets can be added after locking."
        confirmLabel="Lock week"
        loading={busy}
        onClose={() => setModal(null)}
        onConfirm={() => void handleAction("lock")}
      />

      <ConfirmModal
        open={modal === "execute"}
        title="Execute draw?"
        description="This randomly selects winners. Cannot be undone."
        confirmLabel="Execute draw"
        destructive
        loading={busy}
        disableConfirm={executeConfirm !== "EXECUTE DRAW"}
        onClose={() => {
          setModal(null);
          setExecuteConfirm("");
        }}
        onConfirm={() => void handleAction("execute")}
      >
        <div className="space-y-1.5">
          <label htmlFor="execute-confirm" className="text-sm font-medium">
            Type EXECUTE DRAW to confirm
          </label>
          <input
            id="execute-confirm"
            type="text"
            value={executeConfirm}
            onChange={(e) => setExecuteConfirm(e.target.value)}
            disabled={busy}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={modal === "publish"}
        title="Publish winners?"
        description="Winners become visible to all players."
        confirmLabel="Publish"
        loading={busy}
        onClose={() => setModal(null)}
        onConfirm={() => void handleAction("publish")}
      />

      <ConfirmModal
        open={modal === "settle"}
        title="Mark week as settled?"
        description="Indicates prizes have been delivered."
        confirmLabel="Settle"
        loading={busy}
        onClose={() => setModal(null)}
        onConfirm={() => void handleAction("settle")}
      />
    </div>
  );
}
