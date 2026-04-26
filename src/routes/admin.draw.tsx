import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, Play, Send, CheckCircle2, Download, Loader2, RefreshCw } from "lucide-react";
import { getAdminSession } from "@/utils/admin.auth";
import {
  getDrawWeeks,
  lockDrawWeek,
  executeDrawWeek,
  publishWinners,
  settleDrawWeek,
  getWinners,
} from "@/utils/admin.functions";
import { ConfirmModal } from "./-admin/ConfirmModal";

export const Route = createFileRoute("/admin/draw")({
  component: DrawPage,
});

type Week = Awaited<ReturnType<typeof getDrawWeeks>>["weeks"][number];
type Winner = Awaited<ReturnType<typeof getWinners>>["winners"][number];

function DrawPage() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<null | "lock" | "execute" | "publish" | "settle">(null);
  const [executeConfirm, setExecuteConfirm] = useState("");
  const [winnersByWeek, setWinnersByWeek] = useState<Record<string, Winner[]>>({});
  const [openWeekId, setOpenWeekId] = useState<string | null>(null);

  const session = getAdminSession();
  const adminId = session?.adminId;

  const refresh = () => {
    if (!adminId) return;
    setLoading(true);
    getDrawWeeks({ data: { adminId } })
      .then((r) => {
        setWeeks(r.weeks as Week[]);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const current = useMemo(
    () => weeks.find((w) => w.status === "open" || w.status === "locked") ?? weeks[0],
    [weeks],
  );

  const loadWinners = async (weekId: string) => {
    if (!adminId || winnersByWeek[weekId]) return;
    const r = await getWinners({ data: { adminId, drawWeekId: weekId } });
    setWinnersByWeek((m) => ({ ...m, [weekId]: r.winners as Winner[] }));
  };

  const handleAction = async (action: "lock" | "execute" | "publish" | "settle") => {
    if (!adminId || !current) return;
    setBusy(true);
    try {
      const args = { data: { adminId, drawWeekId: current.id } };
      if (action === "lock") await lockDrawWeek(args);
      else if (action === "execute") await executeDrawWeek(args);
      else if (action === "publish") await publishWinners(args);
      else if (action === "settle") await settleDrawWeek(args);
      setModal(null);
      setExecuteConfirm("");
      refresh();
      delete winnersByWeek[current.id];
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handlePublishWeek = async (drawWeekId: string) => {
    if (!adminId) return;
    setBusy(true);
    try {
      await publishWinners({ data: { adminId, drawWeekId } });
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = (week: Week, winners: Winner[]) => {
    const header = "position,prize_type,prize_amount,ticket_id,player_id,nickname,msisdn_last4\n";
    const rows = winners
      .map((w) =>
        [
          w.position,
          w.prize_type,
          w.prize_amount,
          w.ticket_id,
          w.player_id ?? "",
          (w.player?.nickname ?? "").replace(/,/g, " "),
          w.player?.msisdn_last4 ?? "",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `winners-${week.week_start_wat}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Draw management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lock, execute, publish and settle weekly draws.</p>
        </div>
        <button
          onClick={refresh}
          className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-2"
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

      {current && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Current week</p>
              <h2 className="mt-1 text-lg font-semibold">
                {current.week_start_wat} → {current.week_end_wat}
              </h2>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Status: <span className="font-semibold text-foreground capitalize">{current.status}</span></span>
                <span>Tickets: <span className="font-semibold text-foreground tabular-nums">{current.total_tickets}</span></span>
                <span>Players: <span className="font-semibold text-foreground tabular-nums">{current.unique_players}</span></span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Lock at: {new Date(current.entry_lock_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              disabled={current.status !== "open"}
              onClick={() => setModal("lock")}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              <Lock className="h-3.5 w-3.5" /> Lock
            </button>
            <button
              disabled={current.status !== "locked"}
              onClick={() => setModal("execute")}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" /> Execute
            </button>
            <button
              disabled={current.status !== "drawn"}
              onClick={() => setModal("publish")}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" /> Publish winners
            </button>
            <button
              disabled={current.status !== "drawn"}
              onClick={() => setModal("settle")}
              className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-2 disabled:opacity-40"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Settle
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
                <th className="px-3 py-2 text-left">Week</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Tickets</th>
                <th className="px-3 py-2 text-right">Players</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => {
                const isOpen = openWeekId === w.id;
                const winners = winnersByWeek[w.id];
                return (
                  <>
                    <tr
                      key={w.id}
                      className="cursor-pointer border-t border-border hover:bg-surface-2/50"
                      onClick={() => {
                        const next = isOpen ? null : w.id;
                        setOpenWeekId(next);
                        if (next) loadWinners(w.id);
                      }}
                    >
                      <td className="px-3 py-2">
                        {w.week_start_wat} → {w.week_end_wat}
                      </td>
                      <td className="px-3 py-2 capitalize">{w.status}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{w.total_tickets}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{w.unique_players}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-3">
                          {w.status === "drawn" && (
                            <button
                              disabled={busy}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublishWeek(w.id);
                              }}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40"
                            >
                              <Send className="h-3 w-3" /> Publish
                            </button>
                          )}
                          {(w.status === "drawn" || w.status === "settled") && winners && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportCsv(w, winners);
                              }}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Download className="h-3 w-3" /> CSV
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t border-border bg-surface-2/30">
                        <td colSpan={5} className="px-3 py-3">
                          {!winners ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                            </div>
                          ) : winners.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No winners.</p>
                          ) : (
                            <table className="w-full text-xs">
                              <thead className="text-muted-foreground">
                                <tr>
                                  <th className="px-2 py-1 text-left">#</th>
                                  <th className="px-2 py-1 text-left">Player</th>
                                  <th className="px-2 py-1 text-left">Prize</th>
                                  <th className="px-2 py-1 text-left">Ticket</th>
                                </tr>
                              </thead>
                              <tbody>
                                {winners.map((wn) => (
                                  <tr key={wn.id} className="border-t border-border/50">
                                    <td className="px-2 py-1 tabular-nums">{wn.position}</td>
                                    <td className="px-2 py-1">
                                      {wn.player?.nickname ?? "—"}{" "}
                                      <span className="text-muted-foreground">
                                        ***{wn.player?.msisdn_last4 ?? "----"}
                                      </span>
                                    </td>
                                    <td className="px-2 py-1">
                                      {wn.prize_type} ₦{wn.prize_amount.toLocaleString()}
                                    </td>
                                    <td className="px-2 py-1 font-mono text-[10px]">
                                      {wn.ticket_id.slice(0, 12)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {weeks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No draw weeks yet.
                  </td>
                </tr>
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
        onConfirm={() => handleAction("lock")}
      />

      <ConfirmModal
        open={modal === "execute"}
        title="Execute draw?"
        description="This will randomly select winners using a cryptographic seed. This action cannot be undone."
        confirmLabel="Execute draw"
        destructive
        loading={busy}
        disableConfirm={executeConfirm !== "EXECUTE DRAW"}
        onClose={() => {
          setModal(null);
          setExecuteConfirm("");
        }}
        onConfirm={() => handleAction("execute")}
      >
        <label className="text-xs text-muted-foreground">
          Type <span className="font-mono font-bold text-foreground">EXECUTE DRAW</span> to confirm:
        </label>
        <input
          value={executeConfirm}
          onChange={(e) => setExecuteConfirm(e.target.value)}
          className="mt-2 h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm font-mono"
          placeholder="EXECUTE DRAW"
        />
      </ConfirmModal>

      <ConfirmModal
        open={modal === "publish"}
        title="Publish winners?"
        description="Winners will become visible to all players on the Winners screen."
        confirmLabel="Publish"
        loading={busy}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("publish")}
      />

      <ConfirmModal
        open={modal === "settle"}
        title="Mark week as settled?"
        description="This indicates prizes have been delivered. Status becomes settled."
        confirmLabel="Settle"
        loading={busy}
        onClose={() => setModal(null)}
        onConfirm={() => handleAction("settle")}
      />
    </div>
  );
}
