import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle, ChevronDown, CreditCard, Download, Flag, Loader2 } from "lucide-react";
import { getAdminSession } from "@/utils/admin.auth";
import { getDrawWeeks, getWinners, flagWinner, markKycPaid, verifyKyc } from "@/utils/admin.functions";
import { ConfirmModal } from "./-admin/ConfirmModal";

export const Route = createFileRoute("/admin/winners")({
  component: WinnersAdminPage,
});

type Week = Awaited<ReturnType<typeof getDrawWeeks>>["weeks"][number];
type Winner = Awaited<ReturnType<typeof getWinners>>["winners"][number] & { kyc?: any };
type KycAction = { type: "verify" | "paid"; playerId: string; weekId: string } | null;

function kycStatus(kyc: any) {
  if (!kyc) return "None";
  if (kyc.payment_processed) return "Paid";
  if (kyc.verified) return "Verified";
  if (kyc.bank_details_submitted_at) return "Complete";
  if (kyc.submitted_at) return "Identity only";
  return "None";
}

function maskAccount(account?: string | null) {
  return account ? `••••${account.slice(-4)}` : "—";
}

function WinnersAdminPage() {
  const session = getAdminSession();
  const adminId = session?.adminId;
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [winnersByWeek, setWinnersByWeek] = useState<Record<string, Winner[]>>({});
  const [action, setAction] = useState<KycAction>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    if (!adminId) return;
    setLoading(true);
    getDrawWeeks({ data: { adminId } })
      .then((r) => {
        const filtered = (r.weeks as Week[]).filter(
          (w) => w.status === "drawn" || w.status === "settled",
        );
        setWeeks(filtered);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const loadWinners = async (weekId: string, force = false) => {
    if (!adminId || (!force && winnersByWeek[weekId])) return;
    const r = await getWinners({ data: { adminId, drawWeekId: weekId } });
    setWinnersByWeek((m) => ({ ...m, [weekId]: r.winners as Winner[] }));
  };

  const toggleFlag = async (weekId: string, w: Winner) => {
    if (!adminId) return;
    setWinnersByWeek((m) => ({
      ...m,
      [weekId]: m[weekId].map((x) => (x.id === w.id ? { ...x, is_flagged: !x.is_flagged } : x)),
    }));
    try {
      await flagWinner({ data: { adminId, winnerId: w.id, flagged: !w.is_flagged } });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const submitKycAction = async () => {
    if (!adminId || !action) return;
    setBusy(true);
    try {
      if (action.type === "verify") await verifyKyc({ data: { adminId, playerId: action.playerId } });
      if (action.type === "paid") await markKycPaid({ data: { adminId, playerId: action.playerId } });
      await loadWinners(action.weekId, true);
      setAction(null);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = (week: Week, winners: Winner[]) => {
    const header = "position,prize_type,prize_amount,ticket_id,player_id,nickname,msisdn_last4,flagged,kyc_status\n";
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
          w.is_flagged ? "1" : "0",
          kycStatus(w.kyc),
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Winners</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review past draw winners and flag any disputes.</p>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : weeks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No drawn weeks yet.
        </p>
      ) : (
        <div className="space-y-2">
          {weeks.map((w) => {
            const open = openId === w.id;
            const winners = winnersByWeek[w.id];
            return (
              <div key={w.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-2/40">
                  <button
                    onClick={() => {
                      const next = open ? null : w.id;
                      setOpenId(next);
                      if (next) loadWinners(w.id);
                    }}
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {w.week_start_wat} → {w.week_end_wat}
                      </p>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        {w.status} · {w.total_tickets} tickets · {w.unique_players} players
                      </p>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {winners && (
                    <button
                      onClick={() => exportCsv(w, winners)}
                      className="ml-2 flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
                    >
                      <Download className="h-3 w-3" /> CSV
                    </button>
                  )}
                </div>

                {open && (
                  <div className="border-t border-border bg-surface-2/30 p-3">
                    {!winners ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="text-muted-foreground">
                            <tr>
                              <th className="px-2 py-1 text-left">#</th>
                              <th className="px-2 py-1 text-left">Player</th>
                              <th className="px-2 py-1 text-left">Prize</th>
                              <th className="px-2 py-1 text-left">KYC</th>
                              <th className="px-2 py-1 text-left">Payout details</th>
                              <th className="px-2 py-1 text-left">Ticket</th>
                              <th className="px-2 py-1 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {winners.map((wn) => (
                              <tr
                                key={wn.id}
                                className={`border-t border-border/50 ${wn.is_flagged ? "bg-destructive/10" : ""}`}
                              >
                                <td className="px-2 py-1 tabular-nums">{wn.position}</td>
                                <td className="px-2 py-1">
                                  {wn.player?.nickname ?? "—"}{" "}
                                  <span className="text-muted-foreground">***{wn.player?.msisdn_last4 ?? "----"}</span>
                                </td>
                                <td className="px-2 py-1">
                                  {wn.prize_type} ₦{wn.prize_amount.toLocaleString()}
                                </td>
                                <td className="px-2 py-1">
                                  {wn.prize_type === "cash" ? <KycPill status={kycStatus(wn.kyc)} /> : "—"}
                                </td>
                                <td className="px-2 py-1 text-muted-foreground">
                                  {wn.prize_type === "cash" && wn.kyc?.bank_details_submitted_at ? (
                                    <span>
                                      {wn.kyc.account_name ?? "Account name pending"} · {wn.kyc.bank_name ?? "—"} {maskAccount(wn.kyc.account_number)}
                                    </span>
                                  ) : "—"}
                                </td>
                                <td className="px-2 py-1 font-mono text-[10px]">{wn.ticket_id.slice(0, 12)}</td>
                                <td className="px-2 py-1 text-right">
                                  <div className="flex justify-end gap-1">
                                    {wn.prize_type === "cash" && wn.player_id && wn.kyc?.bank_details_submitted_at && !wn.kyc?.verified && (
                                      <button onClick={() => setAction({ type: "verify", playerId: wn.player_id!, weekId: w.id })} className="rounded-md p-1 text-primary hover:bg-primary/10" title="Verify KYC">
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    {wn.prize_type === "cash" && wn.player_id && wn.kyc?.verified && !wn.kyc?.payment_processed && (
                                      <button onClick={() => setAction({ type: "paid", playerId: wn.player_id!, weekId: w.id })} className="rounded-md p-1 text-gold hover:bg-gold/10" title="Mark paid">
                                        <CreditCard className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => toggleFlag(w.id, wn)}
                                      className={`rounded-md p-1 ${wn.is_flagged ? "bg-destructive/20 text-destructive" : "text-muted-foreground hover:bg-surface-2"}`}
                                      title="Toggle flag"
                                    >
                                      <Flag className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
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
      )}

      <ConfirmModal
        open={action !== null}
        title={action?.type === "verify" ? "Verify KYC?" : "Mark prize as paid?"}
        description={action?.type === "verify" ? "This marks the winner as verified for payout." : "This records that payment has been processed."}
        confirmLabel={action?.type === "verify" ? "Verify" : "Mark paid"}
        loading={busy}
        onClose={() => setAction(null)}
        onConfirm={submitKycAction}
      />
    </div>
  );
}

function KycPill({ status }: { status: string }) {
  const style = status === "Paid"
    ? "border-success/30 bg-success/10 text-success"
    : status === "Verified"
      ? "border-primary/30 bg-primary/10 text-primary"
      : status === "Complete"
        ? "border-gold/30 bg-gold/10 text-gold"
        : "border-border bg-surface-2 text-muted-foreground";
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style}`}>{status}</span>;
}
