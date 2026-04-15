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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const normalized = normalizeMsisdn(data.msisdn);
    const msisdnHash = sha256(normalized);
    const last4 = normalized.slice(-4);

    // Rate limiting: check for 5 failed attempts in last 15 min
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("winam_otp_sessions")
      .select("*", { count: "exact", head: true })
      .eq("msisdn_hash", msisdnHash)
      .eq("used", false)
      .gte("created_at", fifteenMinAgo);

    if (count !== null && count >= 5) {
      return { success: false, error: "Too many attempts. Try again in 15 minutes." };
    }

    const otpCode = generateOtp();
    const codeHash = sha256(otpCode);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await supabaseAdmin.from("winam_otp_sessions").insert({
      msisdn_hash: msisdnHash,
      code_hash: codeHash,
      expires_at: expiresAt,
    });

    if (error) {
      console.error("Failed to create OTP session:", error);
      return { success: false, error: "Failed to send OTP" };
    }

    // TODO: SMS_PROVIDER — Replace this console.log with actual SMS delivery
    // Integration point expects: sendSms(normalized, `Your WinamGames code is ${otpCode}`)
    console.log(`[TODO: SMS_PROVIDER] Sending OTP ${otpCode} to ${normalized}`);

    return { success: true, msisdnLast4: last4 };
  });

export const verifyOtp = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    msisdn: z.string().min(10).max(15),
    code: z.string().length(6).regex(/^\d{6}$/),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const normalized = normalizeMsisdn(data.msisdn);
    const msisdnHash = sha256(normalized);
    const codeHash = sha256(data.code);
    const last4 = normalized.slice(-4);

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
    }

    // TODO: Generate a proper session token (JWT or similar)
    // For now, return player info directly
    return {
      success: true,
      playerId,
      isNewPlayer,
      needsOnboarding: isNewPlayer || !existingPlayer?.nickname,
      msisdnLast4: last4,
    };
  });
