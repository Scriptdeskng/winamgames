"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Loader2, Lock, Play, RefreshCw, Send } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session";
import { executeDrawWeek, getDrawWeeks, getWinners, lockDrawWeek, publishWinners, settleDrawWeek } from "@/lib/admin-api";
import { ConfirmModal } from "@/components/admin-confirm-modal";

export default function AdminDrawPage() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<null | "lock" | "execute" | "publish" | "settle">(null);
  const [executeConfirm, setExecuteConfirm] = useState("");
  const [winnersByWeek, setWinnersByWeek] = useState<Record<string, any[]>>({});
  const [openWeekId, setOpenWeekId] = useState<string | null>(null);

  const adminId = getAdminSession()?.adminId ?? "";
  const current = useMemo(() => weeks.find((week) => week.status === "open" || week.status === "locked") ?? weeks[0], [weeks]);

  const refresh = async () => {
    if (!adminId) return;
    setLoading(true);
    try {
      const result = await getDrawWeeks(adminId);
      setWeeks(result.weeks ?? []);
      setErr(null);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to load draws");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [adminId]);

  const loadWinners = async (weekId: string) => {
    if (!adminId || winnersByWeek[weekId]) return;
    const result = await getWinners(adminId, weekId);
    setWinnersByWeek((current) => ({ ...current, [weekId]: result.winners ?? [] }));
  };

  const handleAction = async (action: "lock" | "execute" | "publish" | "settle") => {
    if (!adminId || !current) return;
    if (action === "execute" && executeConfirm !== "EXECUTE DRAW") {
      setErr('Type EXECUTE DRAW to confirm execution.');
      return;
    }
    setBusy(true);
    try {
      const id = current.id;
      if (action === "lock") await lockDrawWeek(adminId, id);
      if (action === "execute") await executeDrawWeek(adminId, id);
      if (action === "publish") await publishWinners(adminId, id);
      if (action === "settle") await settleDrawWeek(adminId, id);
      setModal(null);
      setWinnersByWeek((map) => {
        const next = { ...map };
        delete next[id];
        return next;
      });
      await refresh();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Draw management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lock, execute, publish and settle weekly draws.</p>
        </div>
        <button onClick={refresh} className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-2"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>

      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

      {current && (
        <div className="rounded-xl border border-border bg-surface-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Current week</p>
              <h2 className="mt-1 text-lg font-semibold">{current.week_start_wat} → {current.week_end_wat}</h2>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Status: <span className="font-semibold text-foreground capitalize">{current.status}</span></span>
                <span>Tickets: <span className="font-semibold text-foreground tabular-nums">{current.total_tickets}</span></span>
                <span>Players: <span className="font-semibold text-foreground tabular-nums">{current.unique_players}</span></span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Lock at: {new Date(current.entry_lock_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={current.status !== "open"} onClick={() => setModal("lock")} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"><Lock className="h-3.5 w-3.5" /> Lock</button>
            <button disabled={current.status !== "locked"} onClick={() => setModal("execute")} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"><Play className="h-3.5 w-3.5" /> Execute</button>
            <button disabled={current.status !== "drawn"} onClick={() => setModal("publish")} className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-40"><Send className="h-3.5 w-3.5" /> Publish winners</button>
            <button disabled={current.status !== "drawn"} onClick={() => setModal("settle")} className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-2 disabled:opacity-40"><CheckCircle2 className="h-3.5 w-3.5" /> Settle</button>
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">History</h3>
        <div className="space-y-2">
          {weeks.map((week) => {
            const open = openWeekId === week.id;
            const winners = winnersByWeek[week.id];
            return (
              <div key={week.id} className="overflow-hidden rounded-xl border border-border bg-surface-1">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <button onClick={async () => { const next = open ? null : week.id; setOpenWeekId(next); if (next) await loadWinners(week.id); }} className="flex min-w-0 flex-1 items-center justify-between text-left">
                    <div>
                      <p className="text-sm font-semibold">{week.week_start_wat} → {week.week_end_wat}</p>
                      <p className="text-[10px] uppercase text-muted-foreground">{week.status} · {week.total_tickets} tickets · {week.unique_players} players</p>
                    </div>
                    <span className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
                  </button>
                  {winners && <button onClick={() => exportCsv(week, winners)} className="ml-2 flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"><Download className="h-3 w-3" /> CSV</button>}
                </div>
                {open && (
                  <div className="border-t border-border bg-surface-2/30 p-3">
                    {!winners ? <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" /> : (
                      <div className="overflow-x-auto">
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
                            {winners.map((winner) => (
                              <tr key={winner.id} className={`border-t border-border/50 ${winner.is_flagged ? "bg-destructive/10" : ""}`}>
                                <td className="px-2 py-1 tabular-nums">{winner.position}</td>
                                <td className="px-2 py-1">{winner.player?.nickname ?? "—"} <span className="text-muted-foreground">***{winner.player?.msisdn_last4 ?? "----"}</span></td>
                                <td className="px-2 py-1">{winner.prize_type} ₦{Number(winner.prize_amount).toLocaleString()}</td>
                                <td className="px-2 py-1 text-muted-foreground">{winner.ticket_id?.slice(0, 8).toUpperCase()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={modal !== null}
        title={`Confirm ${modal ?? ""}`}
        description={modal === "execute" ? "Type EXECUTE DRAW to continue." : "This action updates the weekly draw state."}
        confirmLabel="Confirm"
        destructive={modal === "settle"}
        loading={busy}
        onConfirm={() => handleAction(modal ?? "lock")}
        onClose={() => {
          setModal(null);
          setExecuteConfirm("");
        }}
        disableConfirm={modal === "execute" && executeConfirm !== "EXECUTE DRAW"}
      >
        {modal === "execute" && (
          <div className="space-y-2">
            <input
              value={executeConfirm}
              onChange={(e) => setExecuteConfirm(e.target.value)}
              placeholder="EXECUTE DRAW"
              className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Type the exact phrase to execute the current draw.
            </p>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}

function exportCsv(week: any, winners: any[]) {
  const header = "position,prize_type,prize_amount,ticket_id,player_id,nickname,msisdn_last4\n";
  const rows = winners.map((winner) => [
    winner.position,
    winner.prize_type,
    winner.prize_amount,
    winner.ticket_id,
    winner.player_id ?? "",
    (winner.player?.nickname ?? "").replace(/,/g, " "),
    winner.player?.msisdn_last4 ?? "",
  ].join(",")).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `winners-${week.week_start_wat}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
