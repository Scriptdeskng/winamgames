"use client";

import { useEffect, useState } from "react";
import { Download, Flag, Loader2, ShieldCheck, CreditCard } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session";
import { createPaymentRecord, flagWinner, getDrawWeeks, getKycForPlayer, getPayments, getWinners, markPaymentPaid, verifyKyc } from "@/lib/admin-api";

export default function AdminWinnersPage() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [winnersByWeek, setWinnersByWeek] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const adminId = getAdminSession()?.adminId ?? "";

  useEffect(() => {
    getDrawWeeks(adminId).then((result) => {
      setWeeks((result.weeks ?? []).filter((week: any) => week.status === "drawn" || week.status === "settled"));
    }).catch((error) => setErr(error instanceof Error ? error.message : "Failed to load winners")).finally(() => setLoading(false));
  }, [adminId]);

  const loadWinners = async (weekId: string) => {
    if (winnersByWeek[weekId]) return;
    const result = await getWinners(adminId, weekId);
    setWinnersByWeek((current) => ({ ...current, [weekId]: result.winners ?? [] }));
  };

  const toggleFlag = async (weekId: string, winner: any) => {
    setBusy(true);
    try {
      await flagWinner(adminId, winner.id, !winner.is_flagged);
      await hydrateWeek(weekId);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Flag update failed");
    } finally {
      setBusy(false);
    }
  };

  const verifyWinnerKyc = async (weekId: string, winner: any) => {
    if (!winner.player_id) return;
    setBusy(true);
    try {
      await verifyKyc(adminId, winner.player_id);
      await hydrateWeek(weekId);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "KYC verification failed");
    } finally {
      setBusy(false);
    }
  };

  const markPaid = async (weekId: string, winner: any) => {
    if (!winner.player_id) return;
    setBusy(true);
    try {
      const payments = await getPayments(adminId, winner.player_id);
      let paymentId = payments.payments?.find((payment: any) => payment.winner_id === winner.id)?.id;
      if (!paymentId) {
        const created = await createPaymentRecord(adminId, winner.player_id, winner.id, winner.draw_week_id, winner.prize_amount, winner.prize_type);
        paymentId = created.paymentId;
      }
      await markPaymentPaid(adminId, paymentId, winner.player_id);
      await hydrateWeek(weekId);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Payment update failed");
    } finally {
      setBusy(false);
    }
  };

  const hydrateWeek = async (weekId: string) => {
    const result = await getWinners(adminId, weekId);
    setWinnersByWeek((current) => ({ ...current, [weekId]: result.winners ?? [] }));
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Winners</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review past draw winners and flag disputes.</p>
      </div>
      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
      {weeks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">No drawn weeks yet.</p>
      ) : (
        <div className="space-y-2">
          {weeks.map((week) => {
            const open = openId === week.id;
            const winners = winnersByWeek[week.id];
            return (
              <div key={week.id} className="overflow-hidden rounded-xl border border-border bg-surface-1">
                <button onClick={async () => { const next = open ? null : week.id; setOpenId(next); if (next) await loadWinners(week.id); }} className="flex w-full items-center justify-between px-4 py-3 text-left">
                  <div>
                    <p className="text-sm font-semibold">{week.week_start_wat} → {week.week_end_wat}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">{week.status} · {week.total_tickets} tickets · {week.unique_players} players</p>
                  </div>
                  <span className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
                </button>
                {open && (
                  <div className="border-t border-border bg-surface-2/30 p-3">
                    {!winners ? <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" /> : (
                      <div className="space-y-2">
                        <button onClick={() => exportCsv(week, winners)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"><Download className="h-3 w-3" /> CSV</button>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-muted-foreground">
                              <tr>
                                <th className="px-2 py-1 text-left">#</th>
                                <th className="px-2 py-1 text-left">Player</th>
                                <th className="px-2 py-1 text-left">Prize</th>
                                <th className="px-2 py-1 text-left">Flag</th>
                              </tr>
                            </thead>
                            <tbody>
                            {winners.map((winner) => (
                              <tr key={winner.id} className={`border-t border-border/50 ${winner.is_flagged ? "bg-destructive/10" : ""}`}>
                                <td className="px-2 py-1 tabular-nums">{winner.position}</td>
                                <td className="px-2 py-1">
                                  <div>{winner.player?.nickname ?? "—"} <span className="text-muted-foreground">***{winner.player?.msisdn_last4 ?? "----"}</span></div>
                                  {winner.player_id && <WinnerMeta adminId={adminId} playerId={winner.player_id} />}
                                </td>
                                <td className="px-2 py-1">{winner.prize_type} ₦{Number(winner.prize_amount).toLocaleString()}</td>
                                <td className="px-2 py-1">
                                  <div className="flex flex-wrap gap-1.5">
                                    <button onClick={() => toggleFlag(week.id, winner)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2">
                                      <Flag className="h-3 w-3" /> {winner.is_flagged ? "Unflag" : "Flag"}
                                    </button>
                                    {winner.prize_type === "cash" && (
                                      <button onClick={() => verifyWinnerKyc(week.id, winner)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2">
                                        <ShieldCheck className="h-3 w-3" /> Verify KYC
                                      </button>
                                    )}
                                    {winner.prize_type === "cash" && (
                                      <button onClick={() => markPaid(week.id, winner)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2">
                                        <CreditCard className="h-3 w-3" /> Mark paid
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WinnerMeta({ adminId, playerId }: { adminId: string; playerId: string }) {
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    getKycForPlayer(adminId, playerId)
      .then((result) => {
        if (!cancelled) setMeta(result);
      })
      .catch(() => {
        if (!cancelled) setMeta(null);
      });
    return () => {
      cancelled = true;
    };
  }, [adminId, playerId]);

  const kyc = meta?.kyc;
  if (!kyc) {
    return <p className="text-[10px] text-muted-foreground">No KYC</p>;
  }

  return (
    <p className="text-[10px] text-muted-foreground">
      {kyc.verified ? "Verified KYC" : kyc.bank_details_submitted_at ? "Bank submitted" : "Identity only"}
    </p>
  );
}

function exportCsv(week: any, winners: any[]) {
  const header = "position,prize_type,prize_amount,ticket_id,player_id,nickname,msisdn_last4,flagged\n";
  const rows = winners.map((winner) => [
    winner.position,
    winner.prize_type,
    winner.prize_amount,
    winner.ticket_id,
    winner.player_id ?? "",
    (winner.player?.nickname ?? "").replace(/,/g, " "),
    winner.player?.msisdn_last4 ?? "",
    winner.is_flagged ? "1" : "0",
  ].join(",")).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `winners-${week.week_start_wat}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
