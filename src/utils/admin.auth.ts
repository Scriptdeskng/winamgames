import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bcrypt = await import("bcryptjs");

    const { data: row, error } = await supabaseAdmin
      .from("winam_admin_users")
      .select("id, email, role, password_hash")
      .eq("email", data.email.toLowerCase())
      .maybeSingle();

    if (error || !row) {
      return { success: false as const, error: "Invalid credentials" };
    }

    const ok = await bcrypt.compare(data.password, row.password_hash);
    if (!ok) {
      return { success: false as const, error: "Invalid credentials" };
    }

    return {
      success: true as const,
      session: { adminId: row.id, email: row.email, role: row.role },
    };
  });

export const verifyAdminSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("winam_admin_users")
      .select("id, email, role")
      .eq("id", data.adminId)
      .maybeSingle();
    if (!row) return { valid: false as const };
    return {
      valid: true as const,
      session: { adminId: row.id, email: row.email, role: row.role },
    };
  });
