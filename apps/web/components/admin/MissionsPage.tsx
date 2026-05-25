"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, Pencil, Plus } from "lucide-react";
import { createMission, getAdminMissions, requireAdminSession, updateMission } from "@/lib/api";

interface MissionRow {
  id: string;
  title: string;
  description: string | null;
  condition_type: string;
  condition_target: number;
  reward_amount: number;
  reward_type: string;
  is_active: boolean;
  is_repeatable: boolean;
  game_type: string | null;
  created_at: string;
}

interface FormState {
  id?: string;
  title: string;
  description: string;
  game_type: string | null;
  condition_type: string;
  condition_target: number;
  reward_type: string;
  reward_amount: number;
  is_active: boolean;
  is_repeatable: boolean;
}

const CONDITION_TYPES = [
  "puzzles_solved",
  "no_hints",
  "streak_day",
  "game_type_mix",
] as const;

const REWARD_TYPES = ["coins", "entries"] as const;

const GAME_TYPES = ["checkmate", "wisdomdrop"] as const;

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  game_type: null,
  condition_type: "puzzles_solved",
  condition_target: 5,
  reward_type: "coins",
  reward_amount: 100,
  is_active: true,
  is_repeatable: false,
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadMissions() {
    setErr(null);
    try {
      const admin = await requireAdminSession();
      const result = await getAdminMissions(admin.adminId);
      setMissions(
        (result.missions ?? []).map((mission) => {
          const row = mission as unknown as Record<string, unknown>;
          return {
            id: String(row.id ?? ""),
            title: String(row.title ?? ""),
            description: null,
            condition_type: String(row.condition_type ?? "puzzles_solved"),
            condition_target: Number(row.condition_value ?? row.condition_target ?? 0),
            reward_amount: Number(row.reward_amount ?? 0),
            reward_type: String(row.reward_type ?? "coins"),
            is_active: Boolean(row.is_active ?? false),
            is_repeatable: Boolean(row.is_repeatable ?? false),
            game_type: (row.game_type as string | null) ?? null,
            created_at: String(row.created_at ?? new Date().toISOString()),
          };
        }),
      );
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to load missions");
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadMissions();
      setLoading(false);
    }
    void init();
  }, []);

  async function toggleActive(m: MissionRow) {
    const next = !m.is_active;
    setMissions((prev) =>
      prev.map((item) =>
        item.id === m.id ? { ...item, is_active: next } : item,
      ),
    );
    setErr(null);

    try {
      const admin = await requireAdminSession();
      await updateMission({
        adminId: admin.adminId,
        missionId: m.id,
        isActive: next,
      });
    } catch (error) {
      setMissions((prev) =>
        prev.map((item) =>
          item.id === m.id ? { ...item, is_active: m.is_active } : item,
        ),
      );
      setErr(error instanceof Error ? error.message : "Failed to update mission");
    }
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    setErr(null);

    try {
      const admin = await requireAdminSession();
      if (editing.id) {
        await updateMission({
          adminId: admin.adminId,
          missionId: editing.id,
          title: editing.title,
          gameType: editing.game_type,
          conditionType: editing.condition_type,
          conditionValue: editing.condition_target,
          rewardType: editing.reward_type,
          rewardAmount: editing.reward_amount,
          isActive: editing.is_active,
        });
      } else {
        await createMission({
          adminId: admin.adminId,
          title: editing.title,
          gameType: editing.game_type,
          conditionType: editing.condition_type,
          conditionValue: editing.condition_target,
          rewardType: editing.reward_type,
          rewardAmount: editing.reward_amount,
          isActive: editing.is_active,
        });
      }

      setEditing(null);
      await loadMissions();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save mission");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Missions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily and weekly mission templates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...EMPTY_FORM })}
          className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          New mission
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Changes apply on the next session start. Existing player progress is not
        reset.
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
              <th className="px-3 py-2 text-left font-medium">Title</th>
              <th className="px-3 py-2 text-left font-medium">Game</th>
              <th className="px-3 py-2 text-left font-medium">Condition</th>
              <th className="px-3 py-2 text-left font-medium">Reward</th>
              <th className="px-3 py-2 text-left font-medium">Repeatable</th>
              <th className="px-3 py-2 text-left font-medium">Active</th>
              <th className="px-3 py-2 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {missions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No missions yet.
                </td>
              </tr>
            ) : (
              missions.map((m) => (
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
                    {m.condition_type}:{" "}
                    <span className="font-mono">{m.condition_target}</span>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {m.reward_type}:{" "}
                    <span className="font-mono">{m.reward_amount}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {m.is_repeatable ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={m.is_active}
                      onChange={() => void toggleActive(m)}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          id: m.id,
                          title: m.title,
                          description: m.description ?? "",
                          game_type: m.game_type,
                          condition_type: m.condition_type,
                          condition_target: m.condition_target,
                          reward_type: m.reward_type,
                          reward_amount: m.reward_amount,
                          is_active: m.is_active,
                          is_repeatable: m.is_repeatable,
                        })
                      }
                      className="rounded-md p-1.5 hover:bg-surface-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            disabled={busy}
            onClick={() => {
              if (!busy) setEditing(null);
            }}
          />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold">
              {editing.id ? "Edit mission" : "New mission"}
            </h3>

            <div className="mt-4 grid gap-3">
              <Field label="Title">
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={editing.description}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                />
              </Field>

              <Field label="Game type">
                <select
                  value={editing.game_type ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      game_type: e.target.value || null,
                    })
                  }
                  className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
                >
                  <option value="">Any</option>
                  {GAME_TYPES.map((gt) => (
                    <option key={gt} value={gt}>
                      {gt}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Condition">
                  <select
                    value={editing.condition_type}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        condition_type: e.target.value,
                      })
                    }
                    className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
                  >
                    {CONDITION_TYPES.map((ct) => (
                      <option key={ct} value={ct}>
                        {ct}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Target">
                  <input
                    type="number"
                    value={editing.condition_target}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        condition_target: Number(e.target.value),
                      })
                    }
                    className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Reward type">
                  <select
                    value={editing.reward_type}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        reward_type: e.target.value,
                      })
                    }
                    className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
                  >
                    {REWARD_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Amount">
                  <input
                    type="number"
                    value={editing.reward_amount}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        reward_amount: Number(e.target.value),
                      })
                    }
                    className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                  />
                </Field>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) =>
                      setEditing({ ...editing, is_active: e.target.checked })
                    }
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editing.is_repeatable}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        is_repeatable: e.target.checked,
                      })
                    }
                  />
                  Repeatable
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditing(null)}
                className="h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !editing.title.trim()}
                onClick={() => void save()}
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
