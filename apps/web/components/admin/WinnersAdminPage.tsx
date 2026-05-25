"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  ChevronDown,
  CreditCard,
  Download,
  Flag,
  Loader2,
} from "lucide-react";
import {
  flagWinner,
  getAdminDrawWinners,
  getAdminDraws,
  markPaymentPaid,
  requireAdminSession,
  verifyKyc,
} from "@/lib/api";

interface DrawWeek {
  id: string;
  week_start_wat: string;
  week_end_wat: string;
  status: string;
  winners_published: boolean;
}

interface Winner {
  id: string;
  draw_week_id: string;
  player_id: string | null;
  ticket_id: string | null;
  position: number;
  prize_type: string;
  prize_amount: number;
  payment_status: string;
  is_flagged?: boolean;
  payment?: { id?: string; status?: string } | null;
  player?: { nickname: string | null; msisdn_last4: string | null };
  kyc?: {
    verified: boolean;
    submitted_at: string | null;
    bank_details_submitted_at: string | null;
    bank_name: string | null;
    account_number: string | null;
    account_name: string | null;
  } | null;
}

type ConfirmAction = {
  type: "verify" | "paid";
  winnerId: string;
  weekId: string;
} | null;

function kycStatus(kyc: Winner["kyc"]): string {
  if (kyc?.verified) return "Verified";
  if (kyc?.bank_details_submitted_at) return "Complete";
  if (kyc?.submitted_at) return "Identity only";
  return "None";
}

function maskAccount(account?: string | null): string {
  if (!account) return "—";
  return `••••${account.slice(-4)}`;
}

function KycPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Verified:
      "border-primary/30 bg-primary/10 text-primary",
    Complete:
      "border-[oklch(0.75_0.15_85)]/30 bg-[oklch(0.75_0.15_85)]/10 text-[oklch(0.75_0.15_85)]",
    "Identity only": "border-border bg-surface-2 text-muted-foreground",
    None: "border-border bg-surface-2 text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[status] ?? styles.None}`}
    >
      {status}
    </span>
  );
}

function PaymentPill({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const isPaid = normalized === "paid";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        isPaid
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-[oklch(0.75_0.15_85)]/30 bg-[oklch(0.75_0.15_85)]/10 text-[oklch(0.75_0.15_85)]"
      }`}
    >
      {status}
    </span>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
            disabled={loading}
            onClick={onConfirm}
            className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
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

export default function WinnersAdminPage() {
  const [weeks, setWeeks] = useState<DrawWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [winnersByWeek, setWinnersByWeek] = useState<
    Record<string, Winner[] | undefined>
  >({});
  const [action, setAction] = useState<ConfirmAction>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const admin = await requireAdminSession();
        const result = await getAdminDraws(admin.adminId);
        setWeeks(
          ((result.weeks ?? []) as Array<Record<string, unknown>>)
            .filter((week) => ["drawn", "settled"].includes(String(week.status)))
            .map((week) => ({
              id: String(week.id),
              week_start_wat: String(week.week_start_wat),
              week_end_wat: String(week.week_end_wat),
              status: String(week.status),
              winners_published: Boolean(week.winners_published ?? false),
            })),
        );
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load weeks");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  async function loadWinners(weekId: string, force = false) {
    if (winnersByWeek[weekId] !== undefined && !force) return;
    try {
      const admin = await requireAdminSession();
      const result = await getAdminDrawWinners(admin.adminId, weekId);
      const mapped: Winner[] = ((result.winners ?? []) as Array<Record<string, unknown>>).map((w) => ({
        id: String(w.id),
        draw_week_id: String(w.draw_week_id ?? weekId),
        player_id: (w.player_id as string | null) ?? null,
        ticket_id: (w.ticket_id as string | null) ?? null,
        position: Number(w.position ?? 0),
        prize_type: String(w.prize_type ?? "cash"),
        prize_amount: Number(w.prize_amount ?? 0),
        payment_status: String((w.payment as Record<string, unknown> | undefined)?.status ?? "pending"),
        is_flagged: Boolean(w.is_flagged ?? false),
        payment: w.payment
          ? { id: (w.payment as Record<string, unknown>).id as string | undefined, status: (w.payment as Record<string, unknown>).status as string | undefined }
          : null,
        player: w.player
          ? {
              nickname: (w.player as Record<string, unknown>).nickname as string | null,
              msisdn_last4: (w.player as Record<string, unknown>).msisdn_last4 as string | null,
            }
          : undefined,
        kyc: w.kyc
          ? {
              verified: Boolean((w.kyc as Record<string, unknown>).verified ?? false),
              submitted_at: ((w.kyc as Record<string, unknown>).submitted_at as string | null) ?? null,
              bank_details_submitted_at:
                ((w.kyc as Record<string, unknown>).bank_details_submitted_at as string | null) ?? null,
              bank_name: ((w.kyc as Record<string, unknown>).bank_name as string | null) ?? null,
              account_number: ((w.kyc as Record<string, unknown>).account_number as string | null) ?? null,
              account_name: ((w.kyc as Record<string, unknown>).account_name as string | null) ?? null,
            }
          : null,
      }));
      setWinnersByWeek((prev) => ({ ...prev, [weekId]: mapped }));
    } catch {
      setWinnersByWeek((prev) => ({ ...prev, [weekId]: [] }));
    }
  }

  function toggleWeek(weekId: string) {
    if (openId === weekId) {
      setOpenId(null);
      return;
    }
    setOpenId(weekId);
    void loadWinners(weekId);
  }

  function toggleFlag(weekId: string, winner: Winner) {
    void (async () => {
      try {
        const admin = await requireAdminSession();
        await flagWinner({ adminId: admin.adminId, winnerId: winner.id, flagged: !winner.is_flagged });
        setWinnersByWeek((prev) => ({
          ...prev,
          [weekId]: (prev[weekId] ?? []).map((w) =>
            w.id === winner.id ? { ...w, is_flagged: !w.is_flagged } : w,
          ),
        }));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to update flag");
      }
    })();
  }

  async function submitAction() {
    if (!action) return;
    setBusy(true);
    setErr(null);
    try {
      const winners = winnersByWeek[action.weekId] ?? [];
      const winner = winners.find((w) => w.id === action.winnerId);
      if (!winner) throw new Error("Winner not found");

      if (action.type === "verify") {
        if (!winner.player_id) throw new Error("No player linked");
        const admin = await requireAdminSession();
        await verifyKyc({ adminId: admin.adminId, playerId: winner.player_id });
      }

      if (action.type === "paid") {
        const admin = await requireAdminSession();
        const paymentId = winner.payment?.id;
        if (!paymentId) throw new Error("No payment record found");
        await markPaymentPaid({ adminId: admin.adminId, paymentId, playerId: winner.player_id ?? "" });
      }

      await loadWinners(action.weekId, true);
      setAction(null);
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
      "payment_status",
      "kyc_status",
    ];
    const rows = winners.map((w) => [
      w.position,
      w.prize_type,
      w.prize_amount,
      w.player_id ?? "",
      w.player?.nickname ?? "",
      w.player?.msisdn_last4 ?? "",
      w.payment_status,
      kycStatus(w.kyc),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `winners-${week.week_start_wat.slice(0, 10)}.csv`;
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Winners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review draw winners, verify KYC and mark payments.
        </p>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {weeks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          No drawn weeks yet.
        </div>
      ) : (
        <div className="space-y-2">
          {weeks.map((w) => {
            const isOpen = openId === w.id;
            const winners = winnersByWeek[w.id];
            const winnersLoaded = winners !== undefined;

            return (
              <div
                key={w.id}
                className="overflow-hidden rounded-xl border border-border bg-surface-1"
              >
                <div className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-2/40">
                  <button
                    type="button"
                    onClick={() => toggleWeek(w.id)}
                    className="flex min-w-0 flex-1 items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {w.week_start_wat.slice(0, 10)} →{" "}
                        {w.week_end_wat.slice(0, 10)}
                      </p>
                      <p className="text-[10px] uppercase text-muted-foreground">
                        {w.status} · {winners?.length ?? "?"} winners
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {winnersLoaded && (
                    <button
                      type="button"
                      onClick={() => exportCsv(w, winners)}
                      className="ml-2 flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
                    >
                      <Download className="h-3 w-3" />
                      CSV
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-surface-2/30 p-3">
                    {!winnersLoaded ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : winners.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        No winners for this week.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="text-muted-foreground">
                            <tr>
                              <th className="px-2 py-1 text-left font-medium">
                                #
                              </th>
                              <th className="px-2 py-1 text-left font-medium">
                                Player
                              </th>
                              <th className="px-2 py-1 text-left font-medium">
                                Prize
                              </th>
                              <th className="px-2 py-1 text-left font-medium">
                                KYC
                              </th>
                              <th className="px-2 py-1 text-left font-medium">
                                Payment
                              </th>
                              <th className="px-2 py-1 text-left font-medium">
                                Payout details
                              </th>
                              <th className="px-2 py-1 text-left">Ticket</th>
                              <th className="px-2 py-1 text-right font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {winners.map((winner) => {
                              const isCash = winner.prize_type === "cash";
                              const bankSubmitted =
                                !!winner.kyc?.bank_details_submitted_at;
                              const kycSubmitted = !!winner.kyc?.submitted_at;

                              return (
                                <tr
                                  key={winner.id}
                                  className={`border-t border-border/50 ${winner.is_flagged ? "bg-destructive/10" : ""}`}
                                >
                                  <td className="px-2 py-1.5 tabular-nums">
                                    {winner.position}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    {winner.player?.nickname ?? "—"}{" "}
                                    <span className="text-muted-foreground">
                                      ***
                                      {winner.player?.msisdn_last4 ?? "----"}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1.5">
                                    {winner.prize_type} ₦
                                    {winner.prize_amount.toLocaleString()}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    {isCash ? (
                                      <KycPill status={kycStatus(winner.kyc)} />
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    {isCash && kycSubmitted ? (
                                      <PaymentPill
                                        status={winner.payment_status}
                                      />
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    {isCash && bankSubmitted ? (
                                      <>
                                        {winner.kyc?.account_name} ·{" "}
                                        {winner.kyc?.bank_name}{" "}
                                        {maskAccount(
                                          winner.kyc?.account_number,
                                        )}
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-2 py-1 font-mono text-[10px] text-muted-foreground">
                                    {winner.ticket_id ?? "—"}
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <div className="flex justify-end gap-1">
                                      {isCash &&
                                        winner.player_id &&
                                        bankSubmitted &&
                                        !winner.kyc?.verified && (
                                          <button
                                            type="button"
                                            title="Verify KYC"
                                            onClick={() =>
                                              setAction({
                                                type: "verify",
                                                winnerId: winner.id,
                                                weekId: w.id,
                                              })
                                            }
                                            className="rounded-md p-1 text-primary hover:bg-primary/10"
                                          >
                                            <CheckCircle className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      {isCash &&
                                        winner.kyc?.verified &&
                                        winner.payment_status !== "paid" && (
                                          <button
                                            type="button"
                                            title="Mark paid"
                                            onClick={() =>
                                              setAction({
                                                type: "paid",
                                                winnerId: winner.id,
                                                weekId: w.id,
                                              })
                                            }
                                            className="rounded-md p-1 text-[oklch(0.75_0.15_85)] hover:bg-[oklch(0.75_0.15_85)]/10"
                                          >
                                            <CreditCard className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      <button
                                        type="button"
                                        title={
                                          winner.is_flagged
                                            ? "Unflag"
                                            : "Flag"
                                        }
                                        onClick={() =>
                                          toggleFlag(w.id, winner)
                                        }
                                        className={`rounded-md p-1 ${
                                          winner.is_flagged
                                            ? "bg-destructive/20 text-destructive"
                                            : "text-muted-foreground hover:bg-surface-2"
                                        }`}
                                      >
                                        <Flag className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
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
        title={
          action?.type === "verify" ? "Verify KYC?" : "Mark prize as paid?"
        }
        description={
          action?.type === "verify"
            ? "Marks winner as verified for payout."
            : "Records that payment has been processed."
        }
        confirmLabel={action?.type === "verify" ? "Verify" : "Mark paid"}
        loading={busy}
        onClose={() => setAction(null)}
        onConfirm={() => void submitAction()}
      />
    </div>
  );
}
