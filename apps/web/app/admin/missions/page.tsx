"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session";
import { createMission, getMissions, updateMission } from "@/lib/admin-api";

export default function AdminMissionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const adminId = getAdminSession()?.adminId ?? "";

  const refresh = async () => {
    try {
      const result = await getMissions(adminId);
      setRows(result.missions ?? []);
      setErr(null);
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [adminId]);

  const toggle = async (row: any) => {
    setBusy(true);
    try {
      await updateMission(adminId, row.id, { is_active: !row.is_active });
      await refresh();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Missions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daily and weekly mission templates.</p>
        </div>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await createMission(adminId, { title: "New mission", game_type: null, condition_type: "puzzles_solved", condition_value: 5, reward_type: "entries", reward_amount: 1, is_active: true });
              await refresh();
            } catch (error) {
              setErr(error instanceof Error ? error.message : "Create failed");
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> New mission
        </button>
      </div>
      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Game</th>
              <th className="px-3 py-2 text-left">Condition</th>
              <th className="px-3 py-2 text-left">Reward</th>
              <th className="px-3 py-2 text-left">Active</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-2 font-medium">{row.title}</td>
                <td className="px-3 py-2">{row.game_type ?? "any"}</td>
                <td className="px-3 py-2 text-xs">{row.condition_type}: <span className="font-mono">{row.condition_value}</span></td>
                <td className="px-3 py-2 text-xs">{row.reward_type}: <span className="font-mono">{row.reward_amount}</span></td>
                <td className="px-3 py-2"><input type="checkbox" checked={row.is_active} onChange={() => toggle(row)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
