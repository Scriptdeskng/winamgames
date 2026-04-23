import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Save, Plus } from "lucide-react";
import { getAdminSession } from "@/utils/admin.auth";
import { getPlatformConfig, updatePlatformConfig } from "@/utils/admin.functions";

export const Route = createFileRoute("/admin/config")({
  component: ConfigPage,
});

type ConfigRow = Awaited<ReturnType<typeof getPlatformConfig>>["config"][number];

const INTEGER_KEYS = [
  "weekly_cap",
  "hint_penalty",
  "plan_daily_price",
  "plan_weekly_price",
];

function isIntegerKey(key: string) {
  if (INTEGER_KEYS.includes(key)) return true;
  if (/^base_\d+$/.test(key)) return true;
  return false;
}

function ConfigPage() {
  const session = getAdminSession();
  const adminId = session?.adminId;
  const [rows, setRows] = useState<ConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const refresh = () => {
    if (!adminId) return;
    setLoading(true);
    getPlatformConfig({ data: { adminId } })
      .then((r) => {
        setRows(r.config as ConfigRow[]);
        const d: Record<string, string> = {};
        for (const row of r.config) d[row.key] = JSON.stringify(row.value, null, 2);
        setDrafts(d);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const validate = (key: string, value: string) => {
    if (isIntegerKey(key)) {
      if (!/^-?\d+$/.test(value.trim())) return "Must be an integer";
      return null;
    }
    try {
      JSON.parse(value);
      return null;
    } catch {
      return "Invalid JSON";
    }
  };

  const save = async (key: string) => {
    if (!adminId) return;
    const raw = drafts[key];
    const error = validate(key, raw);
    if (error) {
      setErrors({ ...errors, [key]: error });
      return;
    }
    setBusyKey(key);
    try {
      const value = isIntegerKey(key) ? parseInt(raw.trim(), 10) : JSON.parse(raw);
      await updatePlatformConfig({ data: { adminId, key, value } });
      setErrors({ ...errors, [key]: "" });
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  };

  const addNew = async () => {
    if (!adminId || !newKey.trim()) return;
    const error = validate(newKey, newVal);
    if (error) {
      setErr(error);
      return;
    }
    setBusyKey(newKey);
    try {
      const value = isIntegerKey(newKey) ? parseInt(newVal.trim(), 10) : JSON.parse(newVal);
      await updatePlatformConfig({ data: { adminId, key: newKey, value } });
      setNewKey("");
      setNewVal("");
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Platform config</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tune game economy & draw parameters.</p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        Changes take effect on next read — past sessions and ledger entries are not retroactively recalculated.
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const integer = isIntegerKey(r.key);
            const draft = drafts[r.key] ?? "";
            const error = errors[r.key];
            return (
              <div key={r.key} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold">{r.key}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Updated {new Date(r.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => save(r.key)}
                    disabled={busyKey === r.key}
                    className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
                  >
                    <Save className="h-3 w-3" />
                    {busyKey === r.key ? "Saving…" : "Save"}
                  </button>
                </div>
                {integer ? (
                  <input
                    type="number"
                    value={draft}
                    onChange={(e) => setDrafts({ ...drafts, [r.key]: e.target.value })}
                    onBlur={() => {
                      const e = validate(r.key, draft);
                      setErrors({ ...errors, [r.key]: e ?? "" });
                    }}
                    className={`mt-3 h-9 w-full rounded-md border bg-transparent px-3 text-sm ${
                      error ? "border-destructive" : "border-border"
                    }`}
                  />
                ) : (
                  <textarea
                    rows={Math.min(8, draft.split("\n").length)}
                    value={draft}
                    onChange={(e) => setDrafts({ ...drafts, [r.key]: e.target.value })}
                    onBlur={() => {
                      const e = validate(r.key, draft);
                      setErrors({ ...errors, [r.key]: e ?? "" });
                    }}
                    className={`mt-3 w-full rounded-md border bg-transparent px-3 py-2 font-mono text-xs ${
                      error ? "border-destructive" : "border-border"
                    }`}
                  />
                )}
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border p-4">
        <h3 className="text-sm font-semibold">Add new key</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="key_name"
            className="h-9 rounded-md border border-border bg-transparent px-3 text-sm font-mono"
          />
          <input
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder='Value (JSON or integer)'
            className="h-9 rounded-md border border-border bg-transparent px-3 text-sm font-mono"
          />
          <button
            onClick={addNew}
            disabled={!newKey.trim() || !newVal.trim() || busyKey === newKey}
            className="flex h-9 items-center gap-1 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
