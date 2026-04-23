import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Save, Plus } from "lucide-react";
import { getAdminSession } from "@/utils/admin.auth";
import { getPlatformConfig, updatePlatformConfig } from "@/utils/admin.functions";

export const Route = createFileRoute("/admin/config")({
  component: ConfigPage,
});

type ConfigRow = Awaited<ReturnType<typeof getPlatformConfig>>["config"][number];

const INTEGER_KEYS = ["weekly_cap", "hint_penalty", "plan_daily_price", "plan_weekly_price"];

const GROUP_DEFS: { label: string; keys: string[] }[] = [
  {
    label: "Economy",
    keys: ["base_1", "base_2", "base_3", "base_4", "base_5", "hint_penalty", "weekly_cap"],
  },
  {
    label: "Pricing",
    keys: ["plan_daily_price", "plan_weekly_price", "plan_daily_sku", "plan_weekly_sku"],
  },
  {
    label: "Draw",
    keys: ["prize_cash_tiers", "prize_airtime_tiers", "winners_published_week_id"],
  },
  {
    label: "Game",
    keys: ["puzzle_weight_checkmate", "puzzle_weight_wisdomdrop", "free_session_mode"],
  },
];

function isIntegerKey(key: string) {
  if (INTEGER_KEYS.includes(key)) return true;
  if (/^base_\d+$/.test(key)) return true;
  return false;
}

function isStringValue(value: unknown): value is string {
  return typeof value === "string" && !value.includes("\n") && value.length <= 80;
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
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const refresh = () => {
    if (!adminId) return;
    setLoading(true);
    getPlatformConfig({ data: { adminId } })
      .then((r) => {
        setRows(r.config as ConfigRow[]);
        const d: Record<string, string> = {};
        for (const row of r.config) {
          if (isIntegerKey(row.key)) {
            d[row.key] = String(row.value);
          } else if (isStringValue(row.value)) {
            d[row.key] = row.value;
          } else {
            d[row.key] = JSON.stringify(row.value, null, 2);
          }
        }
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

  const grouped = useMemo(() => {
    const assigned = new Set<string>();
    const dynamicEconomyBases = rows
      .map((r) => r.key)
      .filter((k) => /^base_\d+$/.test(k))
      .sort();

    const groups = GROUP_DEFS.map((g) => {
      const keys =
        g.label === "Economy"
          ? Array.from(new Set([...dynamicEconomyBases, ...g.keys]))
          : g.keys;
      const present = keys
        .map((k) => rows.find((r) => r.key === k))
        .filter((r): r is ConfigRow => Boolean(r));
      present.forEach((r) => assigned.add(r.key));
      return { label: g.label, rows: present };
    });

    const other = rows.filter((r) => !assigned.has(r.key));
    if (other.length) groups.push({ label: "Other", rows: other });
    return groups.filter((g) => g.rows.length > 0);
  }, [rows]);

  const isStringKey = (row: ConfigRow) =>
    !isIntegerKey(row.key) && isStringValue(row.value);

  const validate = (key: string, value: string, asString: boolean) => {
    if (isIntegerKey(key)) {
      if (!/^-?\d+$/.test(value.trim())) return "Must be an integer";
      return null;
    }
    if (asString) return null;
    try {
      JSON.parse(value);
      return null;
    } catch {
      return "Invalid JSON";
    }
  };

  const isDirty = (row: ConfigRow) => {
    const draft = drafts[row.key] ?? "";
    if (isIntegerKey(row.key)) return draft.trim() !== String(row.value);
    if (isStringKey(row)) return draft !== (row.value as string);
    return draft !== JSON.stringify(row.value, null, 2);
  };

  const save = async (row: ConfigRow) => {
    if (!adminId) return;
    const raw = drafts[row.key];
    const asString = isStringKey(row);
    const error = validate(row.key, raw, asString);
    if (error) {
      setErrors({ ...errors, [row.key]: error });
      return;
    }
    setBusyKey(row.key);
    try {
      const value = isIntegerKey(row.key)
        ? parseInt(raw.trim(), 10)
        : asString
          ? raw
          : JSON.parse(raw);
      await updatePlatformConfig({ data: { adminId, key: row.key, value } });
      setErrors({ ...errors, [row.key]: "" });
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  };

  const addNew = async () => {
    if (!adminId || !newKey.trim()) return;
    const error = validate(newKey, newVal, false);
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

  const renderRow = (row: ConfigRow) => {
    const integer = isIntegerKey(row.key);
    const stringy = isStringKey(row);
    const draft = drafts[row.key] ?? "";
    const error = errors[row.key];
    const dirty = isDirty(row);
    const focused = focusedKey === row.key;
    const lines = draft.split("\n").length;

    return (
      <div
        key={row.key}
        className="grid grid-cols-[minmax(180px,220px)_1fr_auto] items-start gap-3 border-b border-border/30 py-2"
      >
        <div className="min-w-0 pt-1">
          <p className="truncate font-mono text-sm font-semibold">{row.key}</p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(row.updated_at).toLocaleString()}
          </p>
        </div>
        <div className="min-w-0">
          {integer ? (
            <input
              type="number"
              value={draft}
              onChange={(e) => setDrafts({ ...drafts, [row.key]: e.target.value })}
              onBlur={() => {
                const e = validate(row.key, draft, false);
                setErrors({ ...errors, [row.key]: e ?? "" });
              }}
              className={`tabular-nums h-8 w-[120px] rounded-md border bg-transparent px-2 text-right text-sm ${
                error ? "border-destructive" : "border-border"
              }`}
            />
          ) : stringy ? (
            <input
              type="text"
              value={draft}
              onChange={(e) => setDrafts({ ...drafts, [row.key]: e.target.value })}
              className={`h-8 w-full max-w-md rounded-md border bg-transparent px-2 text-sm ${
                error ? "border-destructive" : "border-border"
              }`}
            />
          ) : (
            <textarea
              rows={focused ? Math.min(12, Math.max(2, lines)) : 2}
              value={draft}
              onFocus={() => setFocusedKey(row.key)}
              onBlur={() => {
                setFocusedKey(null);
                const e = validate(row.key, draft, false);
                setErrors({ ...errors, [row.key]: e ?? "" });
              }}
              onChange={(e) => setDrafts({ ...drafts, [row.key]: e.target.value })}
              className={`w-full rounded-md border bg-transparent px-2 py-1.5 font-mono text-xs leading-snug ${
                error ? "border-destructive" : "border-border"
              }`}
            />
          )}
          {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </div>
        <button
          onClick={() => save(row)}
          disabled={!dirty || busyKey === row.key || Boolean(error)}
          className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-40"
        >
          <Save className="h-3 w-3" />
          {busyKey === row.key ? "Saving…" : "Save"}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Platform config</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tune game economy & draw parameters.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        Changes take effect on next read — past sessions and ledger entries are not
        retroactively recalculated.
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.label}>
              <div className="mb-1 border-b border-border/50 pb-1">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h2>
              </div>
              <div>{group.rows.map(renderRow)}</div>
            </section>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-border p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Add new key
        </h3>
        <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(180px,220px)_1fr_auto]">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="key_name"
            className="h-8 rounded-md border border-border bg-transparent px-2 font-mono text-sm"
          />
          <input
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder="Value (JSON or integer)"
            className="h-8 rounded-md border border-border bg-transparent px-2 font-mono text-sm"
          />
          <button
            onClick={addNew}
            disabled={!newKey.trim() || !newVal.trim() || busyKey === newKey}
            className="flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
