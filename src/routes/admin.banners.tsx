import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, Loader2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getAdminSession } from "@/utils/admin.auth";
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
} from "@/utils/admin.functions";
import { ConfirmModal } from "./-admin/ConfirmModal";

export const Route = createFileRoute("/admin/banners")({
  component: BannersPage,
});

type Banner = Awaited<ReturnType<typeof getBanners>>["banners"][number];

interface FormState {
  id?: string;
  title: string;
  subtitle: string;
  icon_url: string;
  is_active: boolean;
  display_order: number;
}

const EMPTY: FormState = { title: "", subtitle: "", icon_url: "", is_active: true, display_order: 0 };
const TITLE_MAX = 60;
const SUBTITLE_MAX = 120;
const MAX_ACTIVE_BANNERS = 3;

function BannersPage() {
  const session = getAdminSession();
  const adminId = session?.adminId;
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleting, setDeleting] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const refresh = () => {
    if (!adminId) return;
    setLoading(true);
    getBanners({ data: { adminId } })
      .then((r) => {
        setBanners(r.banners as Banner[]);
        setErr(null);
      })
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!adminId) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = banners.findIndex((b) => b.id === active.id);
    const newIdx = banners.findIndex((b) => b.id === over.id);
    const next = arrayMove(banners, oldIdx, newIdx);
    setBanners(next);
    try {
      await reorderBanners({ data: { adminId, order: next.map((b) => b.id) } });
    } catch (e) {
      setErr((e as Error).message);
      refresh();
    }
  };

  const toggleActive = async (b: Banner) => {
    if (!adminId) return;
    const nextActive = !b.is_active;
    if (nextActive && banners.filter((banner) => banner.is_active).length >= MAX_ACTIVE_BANNERS) {
      setErr("Maximum 3 banners can be active at once. Deactivate one first.");
      return;
    }
    setErr(null);
    setBanners((bs) => bs.map((x) => (x.id === b.id ? { ...x, is_active: !x.is_active } : x)));
    try {
      await updateBanner({ data: { adminId, bannerId: b.id, is_active: nextActive } });
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
        subtitle: editing.subtitle,
        icon_url: editing.icon_url || null,
        is_active: editing.is_active,
        display_order: editing.display_order,
      };
      if (editing.id) {
        await updateBanner({ data: { adminId, bannerId: editing.id, ...payload } });
      } else {
        await createBanner({ data: { adminId, ...payload } });
      }
      setEditing(null);
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!adminId || !deleting) return;
    setBusy(true);
    try {
      await deleteBanner({ data: { adminId, bannerId: deleting.id } });
      setDeleting(null);
      refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const titleOverLimit = editing ? editing.title.length > TITLE_MAX : false;
  const subtitleOverLimit = editing ? editing.subtitle.length > SUBTITLE_MAX : false;
  const saveDisabled =
    busy || !editing?.title || !editing?.subtitle || titleOverLimit || subtitleOverLimit;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag to reorder. Toggle to publish.</p>
        </div>
        <button
          onClick={() => setEditing({ ...EMPTY, display_order: banners.length })}
          className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> New banner
        </button>
      </div>

      {err && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {banners.map((b) => (
                <SortableRow
                  key={b.id}
                  banner={b}
                  onToggle={() => toggleActive(b)}
                  onEdit={() =>
                    setEditing({
                      id: b.id,
                      title: b.title,
                      subtitle: b.subtitle,
                      icon_url: b.icon_url ?? "",
                      is_active: b.is_active,
                      display_order: b.display_order,
                    })
                  }
                  onDelete={() => setDeleting(b)}
                />
              ))}
              {banners.length === 0 && (
                <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  No banners yet.
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit / Create modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !busy && setEditing(null)} />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold">{editing.id ? "Edit banner" : "New banner"}</h3>
            <div className="mt-4 space-y-3">
              <Field label="Title">
                <input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
                <p className={`mt-1 text-xs ${titleOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
                  {editing.title.length} / {TITLE_MAX}
                </p>
              </Field>
              <Field label="Subtitle">
                <input
                  value={editing.subtitle}
                  onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
                <p className={`mt-1 text-xs ${subtitleOverLimit ? "text-destructive" : "text-muted-foreground"}`}>
                  {editing.subtitle.length} / {SUBTITLE_MAX}
                </p>
              </Field>
              <Field label="Icon URL (optional)">
                <input
                  value={editing.icon_url}
                  onChange={(e) => setEditing({ ...editing, icon_url: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
                {editing.icon_url && (
                  <img
                    src={editing.icon_url}
                    alt=""
                    className="mt-2 h-12 w-12 rounded-md border border-border object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </Field>
              <Field label="Display order">
                <input
                  type="number"
                  value={editing.display_order}
                  onChange={(e) => setEditing({ ...editing, display_order: parseInt(e.target.value, 10) || 0 })}
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
              </Field>
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
                disabled={saveDisabled}
                className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleting !== null}
        title="Delete banner?"
        description={`"${deleting?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />
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

function SortableRow({
  banner,
  onToggle,
  onEdit,
  onDelete,
}: {
  banner: Banner;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: banner.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      {banner.icon_url ? (
        <img src={banner.icon_url} alt="" className="h-10 w-10 rounded-md border border-border object-cover" />
      ) : (
        <div className="h-10 w-10 rounded-md bg-surface-2" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{banner.title}</p>
        <p className="truncate text-xs text-muted-foreground">{banner.subtitle}</p>
      </div>
      <label className="flex cursor-pointer items-center gap-1.5 text-xs">
        <input type="checkbox" checked={banner.is_active} onChange={onToggle} />
        <span className={banner.is_active ? "text-primary" : "text-muted-foreground"}>
          {banner.is_active ? "Live" : "Draft"}
        </span>
      </label>
      <button onClick={onEdit} className="rounded-md p-1.5 hover:bg-surface-2">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button onClick={onDelete} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
