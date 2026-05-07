import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { winamApiPost } from "@/lib/winam-api";

function sha256(input: string): string {
  return input;
}

function normalizeMsisdn(raw: string): string {
  let cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+234" + cleaned.slice(1);
  } else if (cleaned.startsWith("234")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+234")) {
    throw new Error("Please enter a valid Nigerian mobile number");
  }
  if (!/^\+234[789]\d{9}$/.test(cleaned)) {
    throw new Error("Please enter a valid Nigerian mobile number (e.g. 0813 749 8991)");
  }
  return cleaned;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Helper: compute WAT end-of-day as UTC timestamp */
function watEndOfDay(): string {
  const watOffset = 1; // WAT = UTC+1
  const now = new Date();
  const watDate = new Date(now.getTime() + watOffset * 60 * 60 * 1000);
  const endOfDayWAT = new Date(Date.UTC(
    watDate.getUTCFullYear(), watDate.getUTCMonth(), watDate.getUTCDate(),
    23 - watOffset, 59, 59, 999
  ));
  return endOfDayWAT.toISOString();
}

export const sendOtp = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    msisdn: z.string().min(10).max(15),
  }))
  .handler(async ({ data }): Promise<{ success: boolean; msisdnLast4?: string; error?: string }> => {
    try {
      return await winamApiPost<{ success: boolean; msisdnLast4?: string; error?: string }>("/auth/send-otp", {
        msisdn: data.msisdn,
      });
    } catch (e: any) {
      return { success: false, error: e?.message || "Invalid phone number" };
    }
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    msisdn: z.string().min(10).max(15),
    code: z.string().min(4).max(6).regex(/^\d{4,6}$/),
  }))
  .handler(async ({ data }) => {
    return await winamApiPost<{
      success: boolean;
      playerId?: string;
      isNewPlayer?: boolean;
      needsOnboarding?: boolean;
      msisdnLast4?: string;
      error?: string;
    }>("/auth/verify", {
      msisdn: data.msisdn,
      otp: data.code,
    });
  });

export const setNickname = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    playerId: z.string().uuid(),
    nickname: z.string().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/),
  }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean; error?: string }>("/auth/nickname", {
      playerId: data.playerId,
      nickname: data.nickname,
    });
  });

/** Prototype: renew subscription from /renew page */
export const renewSubscription = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    playerId: z.string().uuid(),
    plan: z.enum(["daily", "weekly"]),
  }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean; error?: string }>("/auth/renew", {
      player_id: data.playerId,
      plan: data.plan,
    });
  });
