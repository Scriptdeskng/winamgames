"use client";

import { Flag, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getAdminPlayers, requireAdminSession } from "@/lib/api";

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

const LIMIT = 25;

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const session = await requireAdminSession();
        const result = await getAdminPlayers(session.adminId, debounced, page, LIMIT);
        setPlayers(
          (result.players ?? []).map((player) => ({
            id: String(player.id),
            nickname: (player.nickname as string | null) ?? null,
            msisdn_last4: (player.msisdn_last4 as string | null) ?? null,
            rank: String(player.rank_tier ?? player.rankTier ?? "starter"),
            coins: Number(player.coin_balance ?? player.coinBalance ?? 0),
            xp: Number(player.xp_total ?? player.xpTotal ?? 0),
            streak: Number(player.current_streak ?? player.currentStreak ?? 0),
            is_flagged: Boolean(player.is_flagged ?? player.isFlagged ?? false),
            created_at: String(player.created_at ?? player.createdAt ?? new Date().toISOString()),
          })),
        );
        setTotal(Number(result.total ?? 0));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load players");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [debounced, page]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Players</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total.toLocaleString()} total players
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by nickname…"
          className="h-10 w-full rounded-md border border-border bg-transparent pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Nickname</th>
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-medium">Tier</th>
              <th className="px-4 py-3 text-right font-medium">Coins</th>
              <th className="px-4 py-3 text-right font-medium">XP</th>
              <th className="px-4 py-3 text-right font-medium">Streak</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </td>
              </tr>
            ) : players.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No players found.
                </td>
              </tr>
            ) : (
              players.map((player) => (
                <tr
                  key={player.id}
                  className="border-t border-border transition-colors hover:bg-surface-2/40"
                >
                  <td className="px-4 py-3 font-medium">
                    {player.is_flagged && (
                      <Flag className="mr-1 inline h-3 w-3 text-destructive" />
                    )}
                    {player.nickname ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    ***{player.msisdn_last4 ?? "----"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                      {player.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {player.coins.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {player.xp.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {player.streak}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(player.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/players/${player.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 rounded-md border border-border px-3 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 rounded-md border border-border px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
