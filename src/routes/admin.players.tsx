import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Loader2, Flag } from "lucide-react";
import { getAdminSession } from "@/utils/admin.auth";
import { getPlayers } from "@/utils/admin.functions";

export const Route = createFileRoute("/admin/players")({
  component: PlayersPage,
});

type Player = Awaited<ReturnType<typeof getPlayers>>["players"][number];

function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const limit = 25;
  const session = getAdminSession();
  const adminId = session?.adminId;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!adminId) return;
    setLoading(true);
    getPlayers({ data: { adminId, search: debounced, page, limit } })
      .then((r) => {
        setPlayers(r.players as Player[]);
        setTotal(r.total);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [adminId, debounced, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

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
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by nickname or last 4 digits…"
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
              <th className="px-3 py-2 text-left">Nickname</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Tier</th>
              <th className="px-3 py-2 text-right">Coins</th>
              <th className="px-3 py-2 text-right">XP</th>
              <th className="px-3 py-2 text-right">Streak</th>
              <th className="px-3 py-2 text-left">Last session</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                </td>
              </tr>
            ) : players.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No players found.
                </td>
              </tr>
            ) : (
              players.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-surface-2/40">
                  <td className="px-3 py-2 font-medium">
                    {p.is_flagged && <Flag className="mr-1 inline h-3 w-3 text-destructive" />}
                    {p.nickname ?? "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-muted-foreground">***{p.msisdn_last4}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                      {p.rank_tier}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.coin_balance.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.xp_total.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{p.current_streak}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {p.last_session_date ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to="/admin/players/$playerId"
                      params={{ playerId: p.id }}
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
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 rounded-md border border-border px-3 disabled:opacity-40"
            >
              Prev
            </button>
            <button
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
