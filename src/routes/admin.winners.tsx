import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDown, Download, Flag, Loader2 } from "lucide-react";
import { getAdminSession } from "@/utils/admin.auth";
import { getDrawWeeks, getWinners, flagWinner } from "@/utils/admin.functions";

export const Route = createFileRoute("/admin/winners")({
  component: WinnersAdminPage,
});

type Week = Awaited<ReturnType<typeof getDrawWeeks>>["weeks"][number];
type Winner = Awaited<ReturnType<typeof getWinners>>["winners"][number];

function WinnersAdminPage() {
  const session = getAdminSession();
  const adminId = session?.adminId;
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [winnersByWeek, setWinnersByWeek] = useState<Record<string, Winner[]>>({});

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

  const loadWinners = async (weekId: string) => {
    if (!adminId || winnersByWeek[weekId]) return;
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

  const exportCsv = (week: Week, winners: Winner[]) => {
    const header = "position,prize_type,prize_amount,ticket_id,player_id,nickname,msisdn_last4,flagged\n";
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
              <div key={w.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => {
                    const next = open ? null : w.id;
                    setOpenId(next);
                    if (next) loadWinners(w.id);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-2/40"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold">
                      {w.week_start_wat} → {w.week_end_wat}
                    </p>
                    <p className="text-[10px] uppercase text-muted-foreground">
                      {w.status} · {w.total_tickets} tickets · {w.unique_players} players
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {winners && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportCsv(w, winners);
                        }}
                        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
                      >
                        <Download className="h-3 w-3" /> CSV
                      </button>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                  </div>
                </button>

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
                              <th className="px-2 py-1 text-left">Ticket</th>
                              <th className="px-2 py-1 text-right">Flag</th>
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
                                  <span className="text-muted-foreground">
                                    ***{wn.player?.msisdn_last4 ?? "----"}
                                  </span>
                                </td>
                                <td className="px-2 py-1">
                                  {wn.prize_type} ₦{wn.prize_amount.toLocaleString()}
                                </td>
                                <td className="px-2 py-1 font-mono text-[10px]">{wn.ticket_id.slice(0, 12)}</td>
                                <td className="px-2 py-1 text-right">
                                  <button
                                    onClick={() => toggleFlag(w.id, wn)}
                                    className={`rounded-md p-1 ${
                                      wn.is_flagged
                                        ? "bg-destructive/20 text-destructive"
                                        : "text-muted-foreground hover:bg-surface-2"
                                    }`}
                                  >
                                    <Flag className="h-3 w-3" />
                                  </button>
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
    </div>
  );
}
