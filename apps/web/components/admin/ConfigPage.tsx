"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info, Loader2, Plus, Save } from "lucide-react";
import { type AdminConfigRow, getAdminConfig, requireAdminSession, updatePlatformConfig } from "@/lib/api";

interface ConfigRow {
  key: string;
  value: string;
  description: string | null;
  category: string | null;
  updated_at: string;
}

export default function ConfigPage() {
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  async function loadConfig() {
    setErr(null);
    try {
      const admin = await requireAdminSession();

      const { config: list } = await getAdminConfig(admin.adminId);
      setRows(
        list.map((row: AdminConfigRow) => ({
          key: row.key,
          value: String(row.value ?? ""),
          description: row.description ?? null,
          category:
            row.category ??
            row.key.split("_")[0]?.replace(/^[a-z]/, (c) => c.toUpperCase()) ??
            "Other",
          updated_at: row.updated_at ?? new Date().toISOString(),
        })),
      );
      const d: Record<string, string> = {};
      for (const row of list) {
        d[row.key] = String(row.value ?? "");
      }
      setDrafts(d);
      setErrors({});
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfig();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ConfigRow[]>();
    for (const row of rows) {
      const label = row.category?.trim() || "Other";
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(row);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, groupRows]) => ({
        label,
        rows: groupRows.sort((a, b) => a.key.localeCompare(b.key)),
      }));
  }, [rows]);

  function isDirty(row: ConfigRow) {
    return drafts[row.key] !== (row.value ?? "");
  }

  async function save(row: ConfigRow) {
    setBusyKey(row.key);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[row.key];
      return next;
    });

    try {
      const admin = await requireAdminSession();
      await updatePlatformConfig({
        adminId: admin.adminId,
        key: row.key,
        value: drafts[row.key],
      });
      await loadConfig();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [row.key]: error instanceof Error ? error.message : "Save failed",
      }));
    }
    setBusyKey(null);
  }

  async function addNew() {
    if (!newKey.trim()) return;
    setBusyKey(newKey.trim());
    setErr(null);

    try {
      const admin = await requireAdminSession();
      await updatePlatformConfig({
        adminId: admin.adminId,
        key: newKey.trim(),
        value: newVal,
      });
      setNewKey("");
      setNewVal("");
      await loadConfig();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Create failed");
    }
    setBusyKey(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform config</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tune game economy and draw parameters.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Changes take effect on the next read. Past sessions are not
        retroactively recalculated.
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="space-y-6">
        {grouped.map((group) => (
          <section key={group.label}>
            <h2 className="mb-1 border-b border-border/50 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground capitalize">
              {group.label}
            </h2>
            {group.rows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[minmax(180px,240px)_1fr_auto] items-start gap-3 border-b border-border/30 py-2"
              >
                <div>
                  <div className="inline-flex items-center gap-1">
                    <span className="font-mono text-sm font-semibold">
                      {row.key}
                    </span>
                    {row.description && (
                      <span className="group/tip relative inline-flex cursor-help">
                        <Info className="h-3 w-3 text-muted-foreground" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-48 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-[10px] leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100">
                          {row.description}
                        </span>
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(row.updated_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={drafts[row.key] ?? ""}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [row.key]: e.target.value,
                      }))
                    }
                    className={`h-8 w-full rounded-md border bg-transparent px-2 text-sm ${
                      errors[row.key] ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors[row.key] && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors[row.key]}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!isDirty(row) || busyKey === row.key}
                  onClick={() => void save(row)}
                  className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-40"
                >
                  <Save className="h-3 w-3" />
                  {busyKey === row.key ? "Saving…" : "Save"}
                </button>
              </div>
            ))}
          </section>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Add new key
        </h3>
        <div className="mt-2 grid gap-2 lg:grid-cols-[200px_1fr_auto]">
          <input
            type="text"
            placeholder="key_name"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="h-8 rounded-md border border-border bg-transparent px-2 font-mono text-sm"
          />
          <input
            type="text"
            placeholder="Value"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="h-8 rounded-md border border-border bg-transparent px-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void addNew()}
            disabled={!newKey.trim() || busyKey === newKey.trim()}
            className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
