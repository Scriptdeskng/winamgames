import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, AlertTriangle, Loader2 } from "lucide-react";
import { getAdminSession } from "@/utils/admin.auth";
import { getMissions, createMission, updateMission } from "@/utils/admin.functions";

export const Route = createFileRoute("/admin/missions")({
  component: MissionsPage,
});

type Mission = Awaited<ReturnType<typeof getMissions>>["missions"][number];

const CONDITION_TYPES = ["puzzles_solved", "no_hints", "streak_day", "game_type_mix"] as const;
const REWARD_TYPES = ["coins", "entries"] as const;
const GAME_TYPES = ["checkmate", "wisdomdrop"] as const;

interface FormState {
  id?: string;
  title: string;
  game_type: "checkmate" | "wisdomdrop" | null;
  condition_type: (typeof CONDITION_TYPES)[number];
  condition_value: number;
  reward_type: (typeof REWARD_TYPES)[number];
  reward_amount: number;
  is_active: boolean;
}

const EMPTY: FormState = {
  title: "",
  game_type: null,
  condition_type: "puzzles_solved",
  condition_value: 5,
  reward_type: "coins",
  reward_amount: 100,
  is_active: true,
};

function MissionsPage() {
  const session = getAdminSession();
  const adminId = session?.adminId;
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    if (!adminId) return;
    setLoading(true);
    getMissions({ data: { adminId } })
      .then((r) => {
        setMissions(r.missions as Mission[]);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const toggleActive = async (m: Mission) => {
    if (!adminId) return;
    setMissions((ms) => ms.map((x) => (x.id === m.id ? { ...x, is_active: !x.is_active } : x)));
    try {
      await updateMission({ data: { adminId, missionId: m.id, is_active: !m.is_active } });
    } catch (e) {
      setErr((e as Error).message);
      refresh();
    }
  };

  const save = async () => {
    if (!adminId || !editing) return;
    setBusy(true);
    try {
      const payload = {
        title: editing.title,
        game_type: editing.game_type,
        condition_type: editing.condition_type,
        condition_value: editing.condition_value,
        reward_type: editing.reward_type,
        reward_amount: editing.reward_amount,
        is_active: editing.is_active,
      };
      if (editing.id) {
        await updateMission({ data: { adminId, missionId: editing.id, ...payload } });
      } else {
        await createMission({ data: { adminId, ...payload } });
      }
      setEditing(null);
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Missions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daily and weekly mission templates.</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY })}
          className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> New mission
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
        Changes apply on the next session start. Existing player progress is not reset.
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Game</th>
                <th className="px-3 py-2 text-left">Condition</th>
                <th className="px-3 py-2 text-left">Reward</th>
                <th className="px-3 py-2 text-left">Active</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-3 py-2 font-medium">{m.title}</td>
                  <td className="px-3 py-2">
                    {m.game_type ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                        {m.game_type}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">any</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {m.condition_type}: <span className="font-mono">{m.condition_value}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {m.reward_type}: <span className="font-mono">{m.reward_amount}</span>
                  </td>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={m.is_active} onChange={() => toggleActive(m)} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() =>
                        setEditing({
                          id: m.id,
                          title: m.title,
                          game_type: m.game_type,
                          condition_type: m.condition_type,
                          condition_value: m.condition_value,
                          reward_type: m.reward_type,
                          reward_amount: m.reward_amount,
                          is_active: m.is_active,
                        })
                      }
                      className="rounded-md p-1.5 hover:bg-surface-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {missions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No missions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !busy && setEditing(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold">{editing.id ? "Edit mission" : "New mission"}</h3>
            <div className="mt-4 grid gap-3">
              <Field label="Title">
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
              </Field>
              <Field label="Game type">
                <select
                  value={editing.game_type ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      game_type: (e.target.value || null) as FormState["game_type"],
                    })
                  }
                  className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
                >
                  <option value="">Any</option>
                  {GAME_TYPES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Condition">
                  <select
                    value={editing.condition_type}
                    onChange={(e) =>
                      setEditing({ ...editing, condition_type: e.target.value as FormState["condition_type"] })
                    }
                    className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
                  >
                    {CONDITION_TYPES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Value">
                  <input
                    type="number"
                    value={editing.condition_value}
                    onChange={(e) => setEditing({ ...editing, condition_value: parseInt(e.target.value, 10) || 0 })}
                    className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Reward type">
                  <select
                    value={editing.reward_type}
                    onChange={(e) =>
                      setEditing({ ...editing, reward_type: e.target.value as FormState["reward_type"] })
                    }
                    className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
                  >
                    {REWARD_TYPES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Amount">
                  <input
                    type="number"
                    value={editing.reward_amount}
                    onChange={(e) => setEditing({ ...editing, reward_amount: parseInt(e.target.value, 10) || 0 })}
                    className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.is_active}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                disabled={busy}
                className="h-9 rounded-md border border-border px-3 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy || !editing.title}
                className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
