import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { winamApiPost } from "@/lib/winam-api";

const ADMIN_SESSION_KEY = "winam_admin_session";

export interface AdminSession {
  adminId: string;
  email: string;
  role: string;
}

// ---- Client-side localStorage helpers ----
export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.adminId || !parsed?.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

// ---- Server functions ----
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(1).max(255),
    })
  )
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean; error?: string; session?: AdminSession }>("/admin/auth/login", {
      email: data.email,
      password: data.password,
    });
  });

export const verifyAdminSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ valid: boolean; session?: AdminSession }>("/admin/auth/verify", {
      admin_id: data.adminId,
    });
  });
