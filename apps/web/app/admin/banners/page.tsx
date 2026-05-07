"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session";
import { createBanner, deleteBanner, getBanners, updateBanner } from "@/lib/admin-api";

export default function AdminBannersPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const adminId = getAdminSession()?.adminId ?? "";

  const refresh = async () => {
    try {
      const result = await getBanners(adminId);
      setRows(result.banners ?? []);
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
      await updateBanner(adminId, row.id, { is_active: !row.is_active });
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
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">Publish and reorder dashboard banners.</p>
        </div>
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await createBanner(adminId, { title: "New banner", subtitle: "Edit me", icon_url: null, is_active: true, display_order: rows.length });
              await refresh();
            } catch (error) {
              setErr(error instanceof Error ? error.message : "Create failed");
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" /> New banner
        </button>
      </div>
      {err && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-border bg-surface-1 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{row.title}</p>
                <p className="text-sm text-muted-foreground">{row.subtitle}</p>
                <p className="mt-2 text-xs text-muted-foreground">Order {row.display_order} · {row.is_active ? "Active" : "Hidden"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(row)} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-surface-2">{row.is_active ? "Hide" : "Show"}</button>
                <button onClick={() => deleteBanner(adminId, row.id)} className="rounded-md border border-border px-3 py-2 text-xs hover:bg-surface-2"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
