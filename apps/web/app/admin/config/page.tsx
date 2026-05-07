"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session";
import { getPlatformConfig, updatePlatformConfig } from "@/lib/admin-api";

export default function AdminConfigPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const adminId = getAdminSession()?.adminId ?? "";

  useEffect(() => {
    getPlatformConfig(adminId).then((r) => {
      setRows(r.config ?? []);
      const next: Record<string, string> = {};
      for (const row of r.config ?? []) next[row.key] = typeof row.value === "string" ? row.value : JSON.stringify(row.value, null, 2);
      setDrafts(next);
    }).catch((error) => setErr(error instanceof Error ? error.message : "Failed")).finally(() => setLoading(false));
  }, [adminId]);

  const save = async (row: any) => {
    setBusyKey(row.key);
    try {
      const raw = drafts[row.key];
      const value = raw.trim().startsWith("{") || raw.trim().startsWith("[") ? JSON.parse(raw) : raw;
      await updatePlatformConfig(adminId, row.key, value);
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Config</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform and economy configuration.</p>
      </div>
      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.key} className="rounded-xl border border-border bg-surface-1 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold">{row.key}</p>
                <p className="text-xs text-muted-foreground">Updated by {row.updated_by ?? "—"}</p>
              </div>
              <button disabled={busyKey === row.key} onClick={() => save(row)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm hover:bg-surface-2 disabled:opacity-40"><Save className="h-3.5 w-3.5" /> Save</button>
            </div>
            <textarea value={drafts[row.key] ?? ""} onChange={(e) => setDrafts((current) => ({ ...current, [row.key]: e.target.value }))} className="mt-3 min-h-24 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono" />
          </div>
        ))}
      </div>
    </div>
  );
}
