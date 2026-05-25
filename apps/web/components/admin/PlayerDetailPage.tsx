"use client";

import {
  ArrowLeft,
  Coins,
  Flag,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  adjustPlayerCoins,
  adjustPlayerXp,
  flagPlayer,
  getAdminPlayerDetail,
  requireAdminSession,
} from "@/lib/api";

interface PlayerDetailPageProps {
  playerId: string;
}

interface Player {
  id: string;
  nickname: string | null;
  msisdn_last4: string | null;
  rank: string;
  coins: number;
  xp: number;
  streak: number;
  is_flagged: boolean;
  created_at: string;
}

interface KycData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  id_type: string | null;
  id_number: string | null;
  verified: boolean;
  submitted_at: string | null;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  verified_at: string | null;
  bank_details_submitted_at: string | null;
}

interface Session {
  id: string;
  game_type: string;
  puzzles_solved: number;
  hints_used: number;
  coins_earned: number;
  xp_earned: number;
  tickets_earned: number;
  completed_at: string;
}

interface Mission {
  id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  mission: { title: string; reward_type: string; reward_amount: number } | null;
}

interface Ticket {
  id: string;
  source: string;
  created_at: string;
  draw_week_id: string;
}

type ModalAction = "flag" | "coins" | "xp" | null;

type MissionRow = {
  id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  winam_missions:
    | { title: string; reward_type: string; reward_amount: number }
    | { title: string; reward_type: string; reward_amount: number }[]
    | null;
};

function formatTicketId(id: string): string {
  return `WG-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function mapMissions(rows: MissionRow[] | null): Mission[] {
  return (rows ?? []).map((row) => {
    const raw = row.winam_missions;
    const nested = Array.isArray(raw) ? (raw[0] ?? null) : raw;
    return {
      id: row.id,
      progress: row.progress,
      completed: row.completed,
      completed_at: row.completed_at,
      mission: nested
        ? {
            title: nested.title,
            reward_type: nested.reward_type,
            reward_amount: nested.reward_amount,
          }
        : null,
    };
  });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold capitalize tabular-nums">
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead className="bg-surface-2 uppercase text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-3 py-6 text-center text-muted-foreground"
              >
                No data.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function PlayerDetailPage({ playerId }: PlayerDetailPageProps) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [kyc, setKyc] = useState<KycData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [action, setAction] = useState<ModalAction>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadData() {
    setLoading(true);
    setErr(null);
    try {
      const admin = await requireAdminSession();
      const detail = await getAdminPlayerDetail(admin.adminId, playerId);
      const playerData = detail.player as Record<string, unknown> | undefined;
      setPlayer(
        playerData
          ? {
              id: String(playerData.id),
              nickname: (playerData.nickname as string | null) ?? null,
              msisdn_last4: (playerData.msisdn_last4 as string | null) ?? null,
              rank: String(playerData.rank_tier ?? playerData.rankTier ?? "starter"),
              coins: Number(playerData.coin_balance ?? playerData.coinBalance ?? 0),
              xp: Number(playerData.xp_total ?? playerData.xpTotal ?? 0),
              streak: Number(playerData.current_streak ?? playerData.currentStreak ?? 0),
              is_flagged: Boolean(playerData.is_flagged ?? playerData.isFlagged ?? false),
              created_at: String(playerData.created_at ?? new Date().toISOString()),
            }
          : null,
      );
      const kycData = detail.kyc as Record<string, unknown> | null | undefined;
      setKyc(
        kycData
          ? {
              id: String(kycData.id),
              first_name: (kycData.first_name as string | null) ?? null,
              last_name: (kycData.last_name as string | null) ?? null,
              date_of_birth: (kycData.dob as string | null) ?? (kycData.date_of_birth as string | null) ?? null,
              id_type: (kycData.id_type as string | null) ?? null,
              id_number: (kycData.id_number as string | null) ?? null,
              verified: Boolean(kycData.verified ?? false),
              submitted_at: (kycData.submitted_at as string | null) ?? null,
              bank_name: (kycData.bank_name as string | null) ?? null,
              account_number: (kycData.account_number as string | null) ?? null,
              account_name: (kycData.account_name as string | null) ?? null,
              verified_at: (kycData.verified_at as string | null) ?? null,
              bank_details_submitted_at:
                (kycData.bank_details_submitted_at as string | null) ?? null,
            }
          : null,
      );
      setSessions(
        ((detail.sessions as Array<Record<string, unknown>>) ?? []).map((session) => ({
          id: String(session.id),
          game_type: String(session.game_type),
          puzzles_solved: Number(session.puzzles_solved ?? 0),
          hints_used: Number(session.hints_used ?? 0),
          coins_earned: Number(session.coins_earned ?? 0),
          xp_earned: Number(session.xp_earned ?? 0),
          tickets_earned: Number(session.entries_awarded ?? session.tickets_earned ?? 0),
          completed_at: String(session.completed_at ?? new Date().toISOString()),
        })),
      );
      setMissions(
        ((detail.missions as Array<Record<string, unknown>>) ?? []).map((mission) => ({
          id: String(mission.id),
          progress: Number(mission.progress_current ?? 0),
          completed: String(mission.status ?? "") === "completed",
          completed_at: (mission.completed_at as string | null) ?? null,
          mission: null,
        })),
      );
      setTickets(
        ((detail.ledger as Array<Record<string, unknown>>) ?? []).map((row) => ({
          id: String(row.source_id ?? row.id),
          source: String(row.source_type ?? row.source ?? "gameplay"),
          created_at: String(row.created_at ?? new Date().toISOString()),
          draw_week_id: String(row.draw_week_id ?? ""),
        })),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load player");
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [playerId]);

  function closeModal() {
    setAction(null);
    setAmount("");
    setReason("");
  }

  async function handleSubmit() {
    if (!player || !action) return;
    setBusy(true);
    setErr(null);
    try {
      const admin = await requireAdminSession();
      if (action === "flag") {
        await flagPlayer({
          adminId: admin.adminId,
          playerId,
          flagged: !player.is_flagged,
          reason,
        });
      } else if (action === "coins") {
        const delta = parseInt(amount, 10);
        if (Number.isNaN(delta)) throw new Error("Invalid amount");
        await adjustPlayerCoins({
          adminId: admin.adminId,
          playerId,
          amount: delta,
          reason,
        });
      } else if (action === "xp") {
        const delta = parseInt(amount, 10);
        if (Number.isNaN(delta)) throw new Error("Invalid amount");
        await adjustPlayerXp({
          adminId: admin.adminId,
          playerId,
          amount: delta,
          reason,
        });
      }

      await loadData();
      closeModal();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const needsAmount = action === "coins" || action === "xp";
  const confirmDisabled =
    busy ||
    !reason.trim() ||
    (needsAmount && !amount.trim());

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!player) {
    return (
      <p className="text-sm text-muted-foreground">Player not found.</p>
    );
  }

  const sessionRows: (string | number)[][] = sessions.map((s) => [
    new Date(s.completed_at).toLocaleString(),
    s.game_type,
    s.puzzles_solved,
    s.hints_used,
    s.coins_earned,
    s.xp_earned,
    s.tickets_earned,
  ]);

  const ticketRows: (string | number)[][] = tickets.map((t) => [
    formatTicketId(t.id),
    t.source,
    t.draw_week_id.slice(0, 8),
    new Date(t.created_at).toLocaleString(),
  ]);

  const missionRows: (string | number)[][] = missions.map((m) => [
    m.mission?.title ?? "—",
    m.completed ? "Complete" : "In progress",
    m.progress,
    m.mission
      ? `${m.mission.reward_type} ${m.mission.reward_amount}`
      : "—",
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/players"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to players
      </Link>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold">
          {player.nickname ?? "Anonymous"}{" "}
          <span className="text-muted-foreground">
            ***{player.msisdn_last4 ?? "----"}
          </span>
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          ID: <span className="font-mono">{player.id}</span> · Joined{" "}
          {new Date(player.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Tier" value={player.rank} />
        <Stat label="Coins" value={player.coins.toLocaleString()} />
        <Stat label="XP" value={player.xp.toLocaleString()} />
        <Stat label="Streak" value={`${player.streak} days`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAction("flag")}
          className={`flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium ${
            player.is_flagged
              ? "border border-border hover:bg-surface-2"
              : "border border-destructive/40 text-destructive hover:bg-destructive/10"
          }`}
        >
          <Flag className="h-4 w-4" />
          {player.is_flagged ? "Unflag" : "Flag"} player
        </button>
        <button
          type="button"
          onClick={() => setAction("coins")}
          className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-2"
        >
          <Coins className="h-4 w-4" />
          Adjust coins
        </button>
        <button
          type="button"
          onClick={() => setAction("xp")}
          className="flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-surface-2"
        >
          <Sparkles className="h-4 w-4" />
          Adjust XP
        </button>
      </div>

      <Section title="KYC">
        {!kyc ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No KYC submitted.
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-surface-1 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Stat
                label="Identity"
                value={
                  kyc.submitted_at
                    ? `Submitted ${new Date(kyc.submitted_at).toLocaleDateString()}`
                    : "Not submitted"
                }
              />
              <Stat
                label="Bank"
                value={
                  kyc.bank_details_submitted_at
                    ? `${kyc.bank_name ?? "Bank"} ••••${kyc.account_number?.slice(-4) ?? "----"}`
                    : "Not submitted"
                }
              />
              <Stat
                label="Verified"
                value={kyc.verified ? "Yes" : "No"}
              />
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                Name: {[kyc.first_name, kyc.last_name].filter(Boolean).join(" ") || "—"}
              </p>
              <p>ID type: {(kyc.id_type ?? "—").toUpperCase()}</p>
              {kyc.account_name && <p>Account name: {kyc.account_name}</p>}
              {kyc.verified && (
                <p className="flex items-center gap-1 text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified
                  {kyc.verified_at &&
                    ` on ${new Date(kyc.verified_at).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </div>
        )}
      </Section>

      <Section title="Recent sessions (last 20)">
        <SimpleTable
          headers={[
            "Date",
            "Game",
            "Solved",
            "Hints",
            "Coins",
            "XP",
            "Tickets",
          ]}
          rows={sessionRows}
        />
      </Section>

      <Section title="Tickets (last 30)">
        <SimpleTable
          headers={["ID", "Source", "Draw week", "Date"]}
          rows={ticketRows}
        />
      </Section>

      <Section title="Mission progress">
        <SimpleTable
          headers={["Mission", "Status", "Progress", "Reward"]}
          rows={missionRows}
        />
      </Section>

      {action !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close modal"
            disabled={busy}
            onClick={() => {
              if (!busy) closeModal();
            }}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5">
            <button
              type="button"
              onClick={() => {
                if (!busy) closeModal();
              }}
              disabled={busy}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="pr-8 text-lg font-semibold">
              {action === "flag"
                ? player.is_flagged
                  ? "Unflag player?"
                  : "Flag player?"
                : action === "coins"
                  ? "Adjust coin balance"
                  : "Adjust XP"}
            </h2>

            <div className="mt-4 space-y-4">
              {needsAmount && (
                <div className="space-y-1.5">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount — use negative to deduct
                  </label>
                  <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={busy}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="reason" className="text-sm font-medium">
                  Reason (required for audit log)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={busy}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={closeModal}
                  className="h-9 rounded-md border border-border px-4 text-sm font-medium hover:bg-surface-2 disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmDisabled}
                  onClick={() => void handleSubmit()}
                  className={`flex h-9 items-center gap-1.5 rounded-md px-4 text-sm font-medium text-primary-foreground disabled:opacity-40 ${
                    action === "flag" && !player.is_flagged
                      ? "bg-destructive hover:bg-destructive/90"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : action === "coins" || action === "xp" ? (
                    <Plus className="h-4 w-4" />
                  ) : null}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
