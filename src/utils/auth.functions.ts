import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeMsisdn(raw: string): string {
  let cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+234" + cleaned.slice(1);
  } else if (cleaned.startsWith("234")) {
    cleaned = "+" + cleaned;
  } else if (!cleaned.startsWith("+234")) {
    throw new Error("Invalid Nigerian MSISDN");
  }
  if (!/^\+234[789]\d{9}$/.test(cleaned)) {
    throw new Error("Invalid Nigerian MSISDN format");
  }
  return cleaned;
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const sendOtp = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    msisdn: z.string().min(10).max(15),
  }))
  .handler(async ({ data }) => {
    const normalized = normalizeMsisdn(data.msisdn);
    const last4 = normalized.slice(-4);

    // TODO: PROTOTYPE MODE — skip OTP table and SMS delivery entirely
    // Replace with real OTP flow before go-live
    console.log(`[PROTOTYPE] OTP request for ****${last4} — use 0000 to verify`);
    return { success: true as const, msisdnLast4: last4, error: null };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    msisdn: z.string().min(10).max(15),
    code: z.string().min(4).max(6).regex(/^\d{4,6}$/),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const normalized = normalizeMsisdn(data.msisdn);
    const msisdnHash = sha256(normalized);
    const codeHash = sha256(data.code);
    const last4 = normalized.slice(-4);

    // TODO: REMOVE before go-live — prototype OTP bypass
    const isTestOtp = data.code === "0000" || data.code === "000000";

    if (!isTestOtp) {
      // Find matching unused, unexpired OTP
      const { data: otpRows, error: otpError } = await supabaseAdmin
        .from("winam_otp_sessions")
        .select("id, expires_at")
        .eq("msisdn_hash", msisdnHash)
        .eq("code_hash", codeHash)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (otpError || !otpRows || otpRows.length === 0) {
        return { success: false, error: "Invalid OTP code" };
      }

      const otpSession = otpRows[0];
      if (new Date(otpSession.expires_at) < new Date()) {
        return { success: false, error: "OTP has expired" };
      }

      // Mark OTP as used
      await supabaseAdmin
        .from("winam_otp_sessions")
        .update({ used: true })
        .eq("id", otpSession.id);
    }

    // Upsert player
    const { data: existingPlayer } = await supabaseAdmin
      .from("winam_players")
      .select("id, nickname")
      .eq("msisdn_hash", msisdnHash)
      .limit(1)
      .maybeSingle();

    let playerId: string;
    let isNewPlayer = false;

    if (existingPlayer) {
      playerId = existingPlayer.id;
    } else {
      const { data: newPlayer, error: insertError } = await supabaseAdmin
        .from("winam_players")
        .insert({
          msisdn_hash: msisdnHash,
          msisdn_last4: last4,
        })
        .select("id")
        .single();

      if (insertError || !newPlayer) {
        console.error("Failed to create player:", insertError);
        return { success: false, error: "Failed to create account" };
      }
      playerId = newPlayer.id;
      isNewPlayer = true;

      // Auto-create daily subscription for new players
      // TODO: Forthsoft billing webhook will replace this stub
      const watOffset = 1; // WAT = UTC+1
      const now = new Date();
      const watDate = new Date(now.getTime() + watOffset * 60 * 60 * 1000);
      const endOfDayWAT = new Date(Date.UTC(
        watDate.getUTCFullYear(), watDate.getUTCMonth(), watDate.getUTCDate(),
        23 - watOffset, 59, 59, 999
      ));
      const { error: subError } = await supabaseAdmin
        .from("winam_subscriptions")
        .insert({
          player_id: playerId,
          plan: "daily",
          status: "active",
          valid_until: endOfDayWAT.toISOString(),
        });

      if (subError) {
        console.error("Failed to create subscription:", subError);
        // Non-fatal: player can still proceed, subscription gate will redirect to /renew
      }
    }

    return {
      success: true,
      playerId,
      isNewPlayer,
      needsOnboarding: isNewPlayer || !existingPlayer?.nickname,
      msisdnLast4: last4,
    };
  });

export const setNickname = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    playerId: z.string().uuid(),
    nickname: z.string().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check uniqueness
    const { data: existing } = await supabaseAdmin
      .from("winam_players")
      .select("id")
      .eq("nickname", data.nickname)
      .neq("id", data.playerId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "Nickname already taken" };
    }

    const { error } = await supabaseAdmin
      .from("winam_players")
      .update({ nickname: data.nickname })
      .eq("id", data.playerId);

    if (error) {
      console.error("Failed to set nickname:", error);
      return { success: false, error: "Failed to save nickname" };
    }

    return { success: true };
  });
