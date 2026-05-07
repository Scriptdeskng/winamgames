"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flag, Loader2, Search } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session";
import { getPlayers } from "@/lib/admin-api";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const limit = 25;

  useEffect(() => {
    const session = getAdminSession();
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    getPlayers(session.adminId, search, page, limit)
      .then((r) => {
        if (cancelled) return;
        setPlayers(r.players ?? []);
        setTotal(r.total ?? 0);
        setErr(null);
      })
      .catch((error) => !cancelled && setErr(error instanceof Error ? error.message : "Failed to load players"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Players</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString()} total players</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by nickname or last 4 digits…" className="h-10 w-full rounded-md border border-border bg-transparent pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </div>
      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Nickname</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Tier</th>
              <th className="px-3 py-2 text-right">Coins</th>
              <th className="px-3 py-2 text-right">XP</th>
              <th className="px-3 py-2 text-right">Tickets</th>
              <th className="px-3 py-2 text-right">Streak</th>
              <th className="px-3 py-2 text-left">Last session</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-3 py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" /></td></tr>
            ) : players.length ? players.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-surface-2/40">
                <td className="px-3 py-2 font-medium">{p.is_flagged && <Flag className="mr-1 inline h-3 w-3 text-destructive" />}{p.nickname ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">***{p.msisdn_last4}</td>
                <td className="px-3 py-2"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">{p.rank_tier}</span></td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(p.coin_balance ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(p.xp_total ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{Number(p.week_tickets ?? 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{p.current_streak}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{p.last_session_date ?? "—"}</td>
                <td className="px-3 py-2 text-right"><Link href={`/admin/players/${p.id}`} className="text-xs text-primary hover:underline">View</Link></td>
              </tr>
            )) : (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">No players found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 rounded-md border border-border px-3 disabled:opacity-40">Prev</button>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="h-8 rounded-md border border-border px-3 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
