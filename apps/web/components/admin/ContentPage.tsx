"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  createBanner,
  deleteBanner,
  type AdminBannerRow,
  type AdminConfigRow,
  getAdminBanners,
  getAdminConfig,
  updateBanner,
  updatePlatformConfig,
  requireAdminSession,
} from "@/lib/api";

interface BannerDraft {
  id?: string;
  title: string;
  subtitle: string;
  icon_url: string;
  is_active: boolean;
  display_order: number;
}

type Tab = "banners" | "announcement" | "support";

const EMPTY_BANNER: BannerDraft = {
  title: "",
  subtitle: "",
  icon_url: "",
  is_active: true,
  display_order: 0,
};

const ANNOUNCEMENT_KEYS = {
  imageUrl: "announcement_image_url",
  ctaLabel: "announcement_cta_label",
  ctaUrl: "announcement_cta_url",
  frequency: "announcement_frequency",
  orientation: "announcement_orientation",
  enabled: "announcement_is_active",
} as const;

const SUPPORT_KEYS = {
  email: "support_email",
  whatsapp: "support_whatsapp",
} as const;

function readConfig(rows: AdminConfigRow[], key: string, fallback = ""): string {
  const row = rows.find((item) => item.key === key);
  return row ? String(row.value ?? "") : fallback;
}

function readConfigBoolean(rows: AdminConfigRow[], key: string, fallback = false): boolean {
  const raw = readConfig(rows, key, fallback ? "true" : "false").trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(raw);
}

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>("banners");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [banners, setBanners] = useState<AdminBannerRow[]>([]);
  const [editingBanner, setEditingBanner] = useState<BannerDraft | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<AdminBannerRow | null>(null);
  const [bannerBusy, setBannerBusy] = useState(false);
  const [bannerErr, setBannerErr] = useState<string | null>(null);

  const [announcementDraft, setAnnouncementDraft] = useState({
    image_url: "",
    cta_label: "",
    cta_url: "",
    frequency: "once_per_week" as "every_login" | "once_per_week" | "once_only",
    orientation: "portrait" as "portrait" | "landscape",
    is_active: false,
  });
  const [supportDraft, setSupportDraft] = useState({
    email: "",
    whatsapp: "",
  });
  const [configBusy, setConfigBusy] = useState(false);
  const [configErr, setConfigErr] = useState<string | null>(null);

  async function loadContent() {
    setLoading(true);
    setError(null);

    try {
      const admin = await requireAdminSession();

      const [bannerResult, configResult] = await Promise.all([
        getAdminBanners(admin.adminId),
        getAdminConfig(admin.adminId),
      ]);

      setBanners(bannerResult.banners ?? []);

      const normalizedConfig = configResult.config ?? [];
      setAnnouncementDraft({
        image_url: readConfig(normalizedConfig, ANNOUNCEMENT_KEYS.imageUrl),
        cta_label: readConfig(normalizedConfig, ANNOUNCEMENT_KEYS.ctaLabel),
        cta_url: readConfig(normalizedConfig, ANNOUNCEMENT_KEYS.ctaUrl),
        frequency:
          (readConfig(normalizedConfig, ANNOUNCEMENT_KEYS.frequency, "once_per_week") as
            | "every_login"
            | "once_per_week"
            | "once_only"),
        orientation:
          (readConfig(normalizedConfig, ANNOUNCEMENT_KEYS.orientation, "portrait") as
            | "portrait"
            | "landscape"),
        is_active: readConfigBoolean(normalizedConfig, ANNOUNCEMENT_KEYS.enabled),
      });
      setSupportDraft({
        email: readConfig(normalizedConfig, SUPPORT_KEYS.email),
        whatsapp: readConfig(normalizedConfig, SUPPORT_KEYS.whatsapp),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContent();
  }, []);

  const announcementPreviewReady = announcementDraft.image_url.trim().length > 0;

  const bannerCount = banners.length;

  async function saveBanner() {
    if (!editingBanner) return;
    setBannerBusy(true);
    setBannerErr(null);

    try {
      const admin = await requireAdminSession();

      if (editingBanner.id) {
        await updateBanner({
          adminId: admin.adminId,
          bannerId: editingBanner.id,
          title: editingBanner.title,
          subtitle: editingBanner.subtitle,
          iconUrl: editingBanner.icon_url || null,
          isActive: editingBanner.is_active,
          displayOrder: editingBanner.display_order,
        });
      } else {
        await createBanner({
          adminId: admin.adminId,
          title: editingBanner.title,
          subtitle: editingBanner.subtitle,
          iconUrl: editingBanner.icon_url || null,
          isActive: editingBanner.is_active,
          displayOrder: editingBanner.display_order,
        });
      }

      setEditingBanner(null);
      await loadContent();
    } catch (err) {
      setBannerErr(err instanceof Error ? err.message : "Failed to save banner");
    } finally {
      setBannerBusy(false);
    }
  }

  async function removeBanner() {
    if (!deletingBanner) return;
    setBannerBusy(true);
    setBannerErr(null);

    try {
      const admin = await requireAdminSession();

      await deleteBanner({
        adminId: admin.adminId,
        bannerId: deletingBanner.id,
      });

      setDeletingBanner(null);
      await loadContent();
    } catch (err) {
      setBannerErr(err instanceof Error ? err.message : "Failed to delete banner");
    } finally {
      setBannerBusy(false);
    }
  }

  async function saveConfigGroup(kind: "announcement" | "support") {
    setConfigBusy(true);
    setConfigErr(null);

    try {
      const admin = await requireAdminSession();

      if (kind === "announcement") {
        await Promise.all([
          updatePlatformConfig({
            adminId: admin.adminId,
            key: ANNOUNCEMENT_KEYS.imageUrl,
            value: announcementDraft.image_url,
          }),
          updatePlatformConfig({
            adminId: admin.adminId,
            key: ANNOUNCEMENT_KEYS.ctaLabel,
            value: announcementDraft.cta_label,
          }),
          updatePlatformConfig({
            adminId: admin.adminId,
            key: ANNOUNCEMENT_KEYS.ctaUrl,
            value: announcementDraft.cta_url,
          }),
          updatePlatformConfig({
            adminId: admin.adminId,
            key: ANNOUNCEMENT_KEYS.frequency,
            value: announcementDraft.frequency,
          }),
          updatePlatformConfig({
            adminId: admin.adminId,
            key: ANNOUNCEMENT_KEYS.orientation,
            value: announcementDraft.orientation,
          }),
          updatePlatformConfig({
            adminId: admin.adminId,
            key: ANNOUNCEMENT_KEYS.enabled,
            value: announcementDraft.is_active,
          }),
        ]);
      } else {
        await Promise.all([
          updatePlatformConfig({
            adminId: admin.adminId,
            key: SUPPORT_KEYS.email,
            value: supportDraft.email,
          }),
          updatePlatformConfig({
            adminId: admin.adminId,
            key: SUPPORT_KEYS.whatsapp,
            value: supportDraft.whatsapp,
          }),
        ]);
      }

      await loadContent();
    } catch (err) {
      setConfigErr(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setConfigBusy(false);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage banners and platform copy used across the app.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Announcement and support settings now come from platform config, so the
        player screens read the same values the admin panel edits.
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-1 border-b border-border">
        {(
          [
            { id: "banners" as const, label: "Banners" },
            { id: "announcement" as const, label: "Announcement" },
            { id: "support" as const, label: "Support" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
              tab === item.id
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "banners" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditingBanner({ ...EMPTY_BANNER })}
              className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              New banner
            </button>
          </div>

          {bannerErr && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {bannerErr}
            </div>
          )}

          {banners.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No banners yet.
            </div>
          ) : (
            <div className="space-y-2">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs text-muted-foreground">
                    {banner.display_order}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{banner.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {banner.subtitle ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                        banner.is_active
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border bg-surface-2 text-muted-foreground"
                      }`}
                    >
                      {banner.is_active ? "Live" : "Draft"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingBanner({
                          id: banner.id,
                          title: banner.title,
                          subtitle: banner.subtitle ?? "",
                          icon_url: banner.icon_url ?? "",
                          is_active: banner.is_active,
                          display_order: banner.display_order,
                        })
                      }
                      className="rounded-md p-1.5 hover:bg-surface-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingBanner(banner)}
                      className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {bannerCount} banner{bannerCount === 1 ? "" : "s"} configured.
          </p>
        </div>
      )}

      {tab === "announcement" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border bg-surface-1 p-4">
            <h2 className="text-sm font-semibold">Announcement settings</h2>

            {configErr && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {configErr}
              </div>
            )}

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Image URL</span>
              <input
                type="url"
                value={announcementDraft.image_url}
                onChange={(e) =>
                  setAnnouncementDraft((prev) => ({ ...prev, image_url: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">CTA label</span>
              <input
                type="text"
                value={announcementDraft.cta_label}
                onChange={(e) =>
                  setAnnouncementDraft((prev) => ({ ...prev, cta_label: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">CTA URL</span>
              <input
                type="url"
                value={announcementDraft.cta_url}
                onChange={(e) =>
                  setAnnouncementDraft((prev) => ({ ...prev, cta_url: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Frequency</span>
                <select
                  value={announcementDraft.frequency}
                  onChange={(e) =>
                    setAnnouncementDraft((prev) => ({
                      ...prev,
                      frequency: e.target.value as
                        | "every_login"
                        | "once_per_week"
                        | "once_only",
                    }))
                  }
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                >
                  <option value="every_login">Every login</option>
                  <option value="once_per_week">Once per week</option>
                  <option value="once_only">Once only</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Orientation</span>
                <select
                  value={announcementDraft.orientation}
                  onChange={(e) =>
                    setAnnouncementDraft((prev) => ({
                      ...prev,
                      orientation: e.target.value as "portrait" | "landscape",
                    }))
                  }
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={announcementDraft.is_active}
                onChange={(e) =>
                  setAnnouncementDraft((prev) => ({ ...prev, is_active: e.target.checked }))
                }
              />
              Active
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={configBusy}
                onClick={() => void saveConfigGroup("announcement")}
                className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {configBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save announcement
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-1 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Preview</h3>
              <span className="text-[10px] text-muted-foreground">
                {announcementDraft.orientation}
              </span>
            </div>
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl bg-black/80 p-4">
              {!announcementPreviewReady ? (
                <p className="text-center text-xs text-white/50">
                  Add an image URL to preview the announcement.
                </p>
              ) : (
                <>
                  <img
                    src={announcementDraft.image_url}
                    alt=""
                    className="w-full rounded-xl object-cover"
                    style={{
                      aspectRatio:
                        announcementDraft.orientation === "portrait" ? "9 / 16" : "16 / 9",
                    }}
                  />
                  {announcementDraft.cta_label && (
                    <button
                      type="button"
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
                    >
                      {announcementDraft.cta_label} →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "support" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border bg-surface-1 p-4">
            <h2 className="text-sm font-semibold">Support links</h2>

            {configErr && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {configErr}
              </div>
            )}

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">Support email</span>
              <input
                type="email"
                value={supportDraft.email}
                onChange={(e) =>
                  setSupportDraft((prev) => ({ ...prev, email: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">WhatsApp number</span>
              <input
                type="tel"
                value={supportDraft.whatsapp}
                onChange={(e) =>
                  setSupportDraft((prev) => ({ ...prev, whatsapp: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={configBusy}
                onClick={() => void saveConfigGroup("support")}
                className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {configBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save support links
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-1 p-4">
            <h3 className="text-sm font-semibold">Player-facing note</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              The support page still shows the FAQ content in the UI, but the contact
              links now come from the backend platform config.
            </p>
            <div className="mt-4 space-y-3 rounded-xl border border-border bg-surface-2 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">Email: </span>
                {supportDraft.email || "Not set"}
              </p>
              <p>
                <span className="text-muted-foreground">WhatsApp: </span>
                {supportDraft.whatsapp || "Not set"}
              </p>
            </div>
          </div>
        </div>
      )}

      {editingBanner !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            disabled={bannerBusy}
            onClick={() => {
              if (!bannerBusy) setEditingBanner(null);
            }}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold">
              {editingBanner.id ? "Edit banner" : "New banner"}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Title</span>
                <input
                  type="text"
                  value={editingBanner.title}
                  onChange={(e) =>
                    setEditingBanner((prev) =>
                      prev ? { ...prev, title: e.target.value } : prev,
                    )
                  }
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Subtitle</span>
                <textarea
                  rows={3}
                  value={editingBanner.subtitle}
                  onChange={(e) =>
                    setEditingBanner((prev) =>
                      prev ? { ...prev, subtitle: e.target.value } : prev,
                    )
                  }
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Icon URL</span>
                <input
                  type="url"
                  value={editingBanner.icon_url}
                  onChange={(e) =>
                    setEditingBanner((prev) =>
                      prev ? { ...prev, icon_url: e.target.value } : prev,
                    )
                  }
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block text-xs text-muted-foreground">Display order</span>
                <input
                  type="number"
                  value={editingBanner.display_order}
                  onChange={(e) =>
                    setEditingBanner((prev) =>
                      prev ? { ...prev, display_order: Number(e.target.value) } : prev,
                    )
                  }
                  className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editingBanner.is_active}
                  onChange={(e) =>
                    setEditingBanner((prev) =>
                      prev ? { ...prev, is_active: e.target.checked } : prev,
                    )
                  }
                />
                Active
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={bannerBusy}
                onClick={() => setEditingBanner(null)}
                className="h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bannerBusy || !editingBanner.title.trim()}
                onClick={() => void saveBanner()}
                className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {bannerBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingBanner !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            disabled={bannerBusy}
            onClick={() => {
              if (!bannerBusy) setDeletingBanner(null);
            }}
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold">Delete banner?</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              &ldquo;{deletingBanner.title}&rdquo; will be permanently removed.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={bannerBusy}
                onClick={() => setDeletingBanner(null)}
                className="h-9 rounded-md border border-border px-3 text-sm disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bannerBusy}
                onClick={() => void removeBanner()}
                className="flex h-9 items-center gap-1.5 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground disabled:opacity-50"
              >
                {bannerBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
