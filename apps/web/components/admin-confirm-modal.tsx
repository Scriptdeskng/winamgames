"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  loading,
  onConfirm,
  onClose,
  children,
  disableConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
  disableConfirm?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !loading && onClose()} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="h-9 rounded-md border border-border bg-transparent px-3 text-sm hover:bg-surface-2 disabled:opacity-50">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={loading || disableConfirm} className={`h-9 rounded-md px-4 text-sm font-medium disabled:opacity-50 ${destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
