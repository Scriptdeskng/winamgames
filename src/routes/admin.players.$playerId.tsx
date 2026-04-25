import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Flag, Coins, Sparkles, X, Plus, Loader2, ShieldCheck } from "lucide-react";
import { getAdminSession } from "@/utils/admin.auth";
import {
  getPlayerDetail,
  flagPlayer,
  adjustPlayerCoins,
  adjustPlayerXP,
  updateSubscription,
  verifyKyc,
  getKycForPlayer,
  getPaymentsForPlayer,
  markPaymentPaid,
} from "@/utils/admin.functions";
import { ConfirmModal } from "./-admin/ConfirmModal";

export const Route = createFileRoute("/admin/players/$playerId")({
  component: PlayerDetailPage,
});

type Detail = Awaited<ReturnType<typeof getPlayerDetail>>;
type Payment = Awaited<ReturnType<typeof getPaymentsForPlayer>>["payments"][number];
type Action = "flag" | "coins" | "xp" | "cancelSub" | "extendSub" | "verifyKyc" | "markPaymentPaid";

function PlayerDetailPage() {
  const { playerId } = Route.useParams();
  const session = getAdminSession();
  const adminId = session?.adminId;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<Action | null>(null);
  const [kyc, setKyc] = useState<any>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentToMark, setPaymentToMark] = useState<Payment | null>(null);
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    if (!adminId) return;
    setLoading(true);
    Promise.all([
      getPlayerDetail({ data: { adminId, playerId } }),
      getKycForPlayer({ data: { adminId, playerId } }),
      getPaymentsForPlayer({ data: { adminId, playerId } }),
    ])
      .then(([r, kycRes, paymentRes]) => {
        setDetail(r as Detail);
        setKyc(kycRes.kyc);
        setPayments(paymentRes.payments as Payment[]);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId, playerId]);

  const closeModal = () => {
    setAction(null);
    setReason("");
    setAmount("");
    setDays("7");
    setPaymentToMark(null);
  };

  const submit = async () => {
    if (!adminId || !detail?.player) return;
    setBusy(true);
    try {
      if (action === "flag") {
        await flagPlayer({
          data: { adminId, playerId, flagged: !detail.player.is_flagged, reason },
        });
      } else if (action === "coins") {
        await adjustPlayerCoins({
          data: { adminId, playerId, amount: parseInt(amount, 10), reason },
        });
      } else if (action === "xp") {
        await adjustPlayerXP({
          data: { adminId, playerId, amount: parseInt(amount, 10), reason },
        });
      } else if (action === "cancelSub") {
        await updateSubscription({ data: { adminId, playerId, action: "cancel", reason } });
      } else if (action === "extendSub") {
        await updateSubscription({
          data: { adminId, playerId, action: "extend", days: parseInt(days, 10), reason },
        });
      } else if (action === "verifyKyc") {
        await verifyKyc({ data: { adminId, playerId } });
      } else if (action === "markPaymentPaid" && paymentToMark) {
        await markPaymentPaid({ data: { adminId, playerId, paymentId: paymentToMark.id } });
      }
      closeModal();
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !detail?.player) {
    return (
      <div className="flex items-center justify-center p-12">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <p className="text-sm text-muted-foreground">Player not found.</p>
        )}
      </div>
    );
  }

  const p = detail.player;

  return (
    <div className="space-y-6">
      <Link to="/admin/players" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to players
      </Link>

      <div>
        <h1 className="text-2xl font-bold">
          {p.nickname ?? "Anonymous"} <span className="text-muted-foreground">***{p.msisdn_last4}</span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          ID: <span className="font-mono">{p.id}</span> · Joined {new Date(p.created_at).toLocaleDateString()}
        </p>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tier" value={p.rank_tier} />
        <Stat label="Coins" value={p.coin_balance.toLocaleString()} />
        <Stat label="XP" value={p.xp_total.toLocaleString()} />
        <Stat label="Streak" value={`${p.current_streak} days`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn onClick={() => setAction("flag")} icon={Flag} destructive={!p.is_flagged}>
          {p.is_flagged ? "Unflag" : "Flag"} player
        </Btn>
        <Btn onClick={() => setAction("coins")} icon={Coins}>Adjust coins</Btn>
        <Btn onClick={() => setAction("xp")} icon={Sparkles}>Adjust XP</Btn>
        <Btn onClick={() => setAction("cancelSub")} icon={X} destructive>Cancel sub</Btn>
        <Btn onClick={() => setAction("extendSub")} icon={Plus}>Extend sub</Btn>
      </div>

      <Section title="Subscriptions">
        <SimpleTable
          headers={["Plan", "Status", "Valid from", "Valid until"]}
          rows={detail.subscriptions.map((s) => [
            s.plan,
            s.status,
            new Date(s.valid_from).toLocaleString(),
            s.valid_until ? new Date(s.valid_until).toLocaleString() : "—",
          ])}
        />
      </Section>

      <KycSection kyc={kyc} onVerify={() => setAction("verifyKyc")} />

      <PaymentHistorySection
        payments={payments}
        onMarkPaid={(payment) => {
          setPaymentToMark(payment);
          setAction("markPaymentPaid");
        }}
      />

      <Section title="Recent sessions (last 20)">
        <SimpleTable
          headers={["Date", "Game", "Solved", "Tickets", "Coins", "Hints"]}
          rows={detail.sessions.map((s) => [
            new Date(s.completed_at).toLocaleString(),
            s.game_type,
            String(s.puzzles_solved),
            String(s.entries_awarded),
            String(s.coins_awarded),
            String(s.hints_used),
          ])}
        />
      </Section>

      <Section title="Tickets per draw week">
        <SimpleTable
          headers={["Draw week", "Source", "Tickets", "When"]}
          rows={detail.ledger.slice(0, 30).map((l) => [
            (l.draw_week_id ?? "").slice(0, 8),
            l.source_type,
            String(l.entries_delta),
            new Date(l.created_at).toLocaleString(),
          ])}
        />
      </Section>

      <Section title="Mission progress">
        <SimpleTable
          headers={["Mission", "Status", "Progress", "Tickets awarded"]}
          rows={detail.missions.map((m) => [
            (m as { mission?: { title?: string } }).mission?.title ?? "—",
            m.status,
            String(m.progress_current),
            String(m.entries_awarded),
          ])}
        />
      </Section>

      <ConfirmModal
        open={action !== null}
        title={
          action === "flag"
            ? p.is_flagged
              ? "Unflag player?"
              : "Flag player?"
            : action === "coins"
              ? "Adjust coin balance"
              : action === "xp"
                ? "Adjust XP"
                : action === "cancelSub"
                  ? "Cancel subscription?"
                  : action === "extendSub"
                    ? "Extend subscription"
                    : action === "verifyKyc"
                      ? "Verify KYC?"
                      : "Mark prize as paid?"
        }
        confirmLabel="Confirm"
        loading={busy}
        destructive={action === "flag" ? !p.is_flagged : action === "cancelSub"}
        disableConfirm={
          ((action !== "verifyKyc" && action !== "markPaymentPaid") && reason.trim().length === 0) ||
          ((action === "coins" || action === "xp") && !amount) ||
          (action === "extendSub" && !days)
        }
        onClose={closeModal}
        onConfirm={submit}
      >
        {(action === "coins" || action === "xp") && (
          <div className="mb-3">
            <label className="text-xs text-muted-foreground">Amount (use negative to deduct)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
            />
          </div>
        )}
        {action === "extendSub" && (
          <div className="mb-3">
            <label className="text-xs text-muted-foreground">Days to extend</label>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
            />
          </div>
        )}
        {action !== "verifyKyc" && action !== "markPaymentPaid" && (
          <>
            <label className="text-xs text-muted-foreground">Reason (required)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
              placeholder="Enter reason for audit log…"
            />
          </>
        )}
      </ConfirmModal>
    </div>
  );
}


function maskAccount(account?: string | null) {
  return account ? `••••${account.slice(-4)}` : "—";
}

function KycSection({
  kyc,
  onVerify,
  onMarkPaid,
}: {
  kyc: any;
  onVerify: () => void;
  onMarkPaid: () => void;
}) {
  if (!kyc) {
    return (
      <Section title="KYC">
        <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          No KYC submitted.
        </div>
      </Section>
    );
  }

  return (
    <Section title="KYC">
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Identity" value={kyc.submitted_at ? `Submitted ${new Date(kyc.submitted_at).toLocaleDateString()}` : "Not submitted"} />
          <Stat label="Bank" value={kyc.bank_details_submitted_at ? `${kyc.bank_name ?? "—"} ${maskAccount(kyc.account_number)}` : "Not submitted"} />
          <Stat label="Verified" value={kyc.verified ? `Yes${kyc.verified_at ? ` · ${new Date(kyc.verified_at).toLocaleDateString()}` : ""}` : "No"} />
          <Stat label="Payment" value={kyc.payment_processed ? `Paid${kyc.payment_processed_at ? ` · ${new Date(kyc.payment_processed_at).toLocaleDateString()}` : ""}` : "Pending"} />
        </div>
        <div className="text-xs text-muted-foreground">
          <p>Name: <span className="text-foreground">{kyc.first_name} {kyc.last_name}</span></p>
          <p>ID type: <span className="uppercase text-foreground">{kyc.id_type}</span></p>
          {kyc.account_name && <p>Account name: <span className="text-foreground">{kyc.account_name}</span></p>}
          {kyc.verified_by && <p>Verified by: <span className="font-mono text-foreground">{String(kyc.verified_by).slice(0, 8)}</span></p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={onVerify} icon={ShieldCheck}>
            Verify KYC
          </Btn>
          <Btn onClick={onMarkPaid} icon={CreditCard}>
            Mark paid
          </Btn>
        </div>
      </div>
    </Section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold capitalize tabular-nums">{value}</p>
    </div>
  );
}

function Btn({
  children,
  onClick,
  icon: Icon,
  destructive,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium ${
        destructive
          ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
          : "border border-border hover:bg-surface-2"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead className="bg-surface-2 uppercase text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-center text-muted-foreground">
                No data.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => (
                  <td key={j} className="px-3 py-1.5">{c}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
