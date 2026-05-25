"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getPublicContent } from "@/lib/api";

interface Announcement {
  id: string;
  image_url: string;
  cta_label: string | null;
  cta_url: string | null;
  frequency: "every_login" | "once_per_week" | "once_only";
  orientation: "portrait" | "landscape";
  is_active: boolean;
}

function shouldShow(announcement: Announcement): boolean {
  const storageKey = `winam_ann_${announcement.id}`;

  if (announcement.frequency === "every_login") {
    const sessionKey = `winam_ann_session_${announcement.id}`;
    return !sessionStorage.getItem(sessionKey);
  }

  if (announcement.frequency === "once_only") {
    const seen = localStorage.getItem(storageKey);
    return !seen;
  }

  if (announcement.frequency === "once_per_week") {
    const lastSeen = localStorage.getItem(storageKey);
    if (!lastSeen) return true;
    const diff = Date.now() - parseInt(lastSeen, 10);
    return diff > 7 * 24 * 60 * 60 * 1000;
  }

  return false;
}

function markSeen(announcement: Announcement): void {
  const storageKey = `winam_ann_${announcement.id}`;

  if (announcement.frequency === "every_login") {
    sessionStorage.setItem(`winam_ann_session_${announcement.id}`, "1");
  }
  if (announcement.frequency === "once_only") {
    localStorage.setItem(storageKey, "1");
  }
  if (announcement.frequency === "once_per_week") {
    localStorage.setItem(storageKey, Date.now().toString());
  }
}

export default function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined;

    void getPublicContent()
      .then(({ announcement: data }) => {
        if (data.image_url && data.is_active && shouldShow(data)) {
          setAnnouncement(data);
          showTimer = setTimeout(() => setVisible(true), 800);
        }
      })
      .catch(() => {
        setAnnouncement(null);
      });

    return () => {
      if (showTimer) clearTimeout(showTimer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    if (announcement) markSeen(announcement);
    setTimeout(() => setAnnouncement(null), 300);
  }

  const isLandscape = announcement?.orientation === "landscape";

  return (
    <AnimatePresence>
      {visible && announcement && (
        <motion.div
          key="announcement-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={
            isLandscape
              ? "fixed inset-0 z-50 flex items-center justify-center p-6"
              : "fixed inset-0 z-50 flex items-center justify-center p-4"
          }
        >
          <div
            className="absolute inset-0 z-0 bg-black/80 backdrop-blur-sm"
            onClick={dismiss}
            aria-hidden
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 flex w-full max-w-[390px] max-h-[90dvh] flex-col gap-2"
          >
            <button
              type="button"
              onClick={dismiss}
              className="w-full text-center text-sm text-white/50 underline underline-offset-2 decoration-white/30 hover:text-white/80 transition-colors py-2 tracking-wide"
              style={{ letterSpacing: "0.05em" }}
            >
              Close
            </button>

            <img
              src={announcement.image_url}
              alt=""
              className="w-full rounded-2xl object-cover"
              style={{
                aspectRatio:
                  announcement.orientation === "portrait" ? "9/16" : "16/9",
                width: "100%",
                objectFit: "cover",
                borderRadius: "12px",
                flex: "1 1 auto",
                minHeight: 0,
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            {announcement.cta_label && announcement.cta_url && (
              <a
                href={announcement.cta_url}
                onClick={dismiss}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {announcement.cta_label} →
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
