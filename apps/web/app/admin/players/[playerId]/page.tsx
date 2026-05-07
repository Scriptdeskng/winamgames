"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Flag, Coins, Sparkles, CreditCard, ShieldCheck } from "lucide-react";
import { adjustPlayerCoins, adjustPlayerXP, flagPlayer, getKycForPlayer, getPayments, getPlayerDetail, updateSubscription, verifyKyc, createPaymentRecord, markPaymentPaid } from "@/lib/admin-api";
import { getAdminSession } from "@/lib/admin-session";

export default function AdminPlayerDetailPage() {
  const router = useRouter();
  const params = useParams<{ playerId: string }>();
  const playerId = params.playerId;
  const [data, setData] = useState<any>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    const session = getAdminSession();
    if (!session) return;
    const detail = await getPlayerDetail(session.adminId, playerId);
    const kycRes = await getKycForPlayer(session.adminId, playerId);
    const paymentRes = await getPayments(session.adminId, playerId);
    setData(detail);
    setKyc(kycRes.kyc);
    setPayments(paymentRes.payments ?? []);
  };

  useEffect(() => {
    load().catch((error) => setErr(error instanceof Error ? error.message : "Failed to load player"));
  }, [playerId]);

  if (!data) {
    return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const session = getAdminSession();
  const adminId = session?.adminId ?? "";
  const player = data.player;

  const doAction = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{player.nickname ?? "Player"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">***{player.msisdn_last4}</p>
        </div>
        <button onClick={() => router.back()} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2">Back</button>
      </div>
      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Balance" icon={Coins} value={`${Number(player.coin_balance ?? 0).toLocaleString()} coins`} />
        <Card title="XP" icon={Sparkles} value={`${Number(player.xp_total ?? 0).toLocaleString()} XP`} />
        <Card title="Streak" icon={Flag} value={`${player.current_streak ?? 0} days`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl bg-surface-1 border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => doAction(() => flagPlayer(adminId, playerId, !player.is_flagged, player.is_flagged ? "Cleared by admin" : "Flagged by admin"))} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2">
              Toggle flag
            </button>
            <button disabled={busy} onClick={() => doAction(() => adjustPlayerCoins(adminId, playerId, 100, "Admin adjustment"))} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2">
              +100 coins
            </button>
            <button disabled={busy} onClick={() => doAction(() => adjustPlayerXP(adminId, playerId, 100, "Admin adjustment"))} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2">
              +100 XP
            </button>
            <button disabled={busy} onClick={() => doAction(() => updateSubscription(adminId, playerId, "extend", 7, "Admin extension"))} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2">
              Extend sub 7d
            </button>
            <button disabled={busy} onClick={() => doAction(() => updateSubscription(adminId, playerId, "cancel", null, "Admin cancel"))} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2">
              Cancel sub
            </button>
          </div>
        </section>
        <section className="rounded-xl bg-surface-1 border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold">KYC</h2>
          <pre className="overflow-x-auto rounded-xl bg-surface-2 p-3 text-xs">{JSON.stringify(kyc, null, 2)}</pre>
          <button disabled={busy || !kyc?.submitted_at || kyc?.verified} onClick={() => doAction(() => verifyKyc(adminId, playerId))} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-2 disabled:opacity-40">
            Verify KYC
          </button>
        </section>
      </div>

      <section className="rounded-xl bg-surface-1 border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold">Payments</h2>
        <div className="space-y-2">
          {payments.length ? payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{payment.prize_type} - ₦{Number(payment.amount_naira).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{payment.status}</p>
              </div>
              {!payment.paid_at ? (
              <button
                  disabled={busy}
                  onClick={() => doAction(async () => {
                    const paymentId = payment.id ?? (await createPaymentRecord(adminId, playerId, payment.winner_id, payment.draw_week_id, payment.amount_naira, payment.prize_type)).paymentId;
                    await markPaymentPaid(adminId, paymentId, playerId);
                  })}
                  className="rounded-md border border-border px-3 py-2 text-xs hover:bg-surface-2"
                >
                  Mark paid
                </button>
              ) : null}
            </div>
          )) : <p className="text-sm text-muted-foreground">No payments yet.</p>}
        </div>
      </section>
    </div>
  );
}

function Card({ title, icon: Icon, value }: { title: string; icon: any; value: string }) {
  return (
    <div className="rounded-xl bg-surface-1 border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
