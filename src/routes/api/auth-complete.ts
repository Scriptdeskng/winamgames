/**
 * POST /api/auth-complete
 *
 * Receives { msisdn, code } from the verify page,
 * validates OTP, upserts player, sets session cookie,
 * and redirects via 303 so the browser follows with the cookie.
 */
import { createFileRoute } from "@tanstack/react-router";
import { buildSessionCookie } from "@/utils/session.server";
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
    throw new Error("Invalid number");
  }
  if (!/^\+234[789]\d{9}$/.test(cleaned)) {
    throw new Error("Invalid number");
  }
  return cleaned;
}

function watEndOfDay(): string {
  const watOffset = 1;
  const now = new Date();
  const watDate = new Date(now.getTime() + watOffset * 60 * 60 * 1000);
  const endOfDayWAT = new Date(
    Date.UTC(
      watDate.getUTCFullYear(),
      watDate.getUTCMonth(),
      watDate.getUTCDate(),
      23 - watOffset,
      59,
      59,
      999
    )
  );
  return endOfDayWAT.toISOString();
}

export const Route = createFileRoute("/api/auth-complete")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const msisdn = body?.msisdn;
          const code = body?.code;

          if (!msisdn || !code) {
            return Response.json(
              { success: false, error: "Missing msisdn or code" },
              { status: 400 }
            );
          }

          let normalized: string;
          try {
            normalized = normalizeMsisdn(msisdn);
          } catch {
            return Response.json(
              { success: false, error: "Invalid phone number" },
              { status: 400 }
            );
          }

          const msisdnHash = sha256(normalized);
          const last4 = normalized.slice(-4);

          // Prototype OTP bypass
          const isTestOtp = code === "0000" || code === "000000";

          if (!isTestOtp) {
            const { supabaseAdmin } = await import(
              "@/integrations/supabase/client.server"
            );
            const codeHash = sha256(code);
            const { data: otpRows, error: otpError } = await supabaseAdmin
              .from("winam_otp_sessions")
              .select("id, expires_at")
              .eq("msisdn_hash", msisdnHash)
              .eq("code_hash", codeHash)
              .eq("used", false)
              .order("created_at", { ascending: false })
              .limit(1);

            if (otpError || !otpRows || otpRows.length === 0) {
              return Response.json(
                { success: false, error: "Invalid OTP code" },
                { status: 401 }
              );
            }

            const otpSession = otpRows[0];
            if (new Date(otpSession.expires_at) < new Date()) {
              return Response.json(
                { success: false, error: "OTP has expired" },
                { status: 401 }
              );
            }

            await supabaseAdmin
              .from("winam_otp_sessions")
              .update({ used: true })
              .eq("id", otpSession.id);
          }

          // Upsert player
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

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

            // Auto-renew subscription for returning players (PROTOTYPE)
            const { data: activeSub } = await supabaseAdmin
              .from("winam_subscriptions")
              .select("id")
              .eq("player_id", playerId)
              .in("status", ["active", "grace"])
              .gte("valid_until", new Date().toISOString())
              .limit(1)
              .maybeSingle();

            if (!activeSub) {
              console.log(
                `[PROTOTYPE] Auto-renewing daily sub for player ${playerId}`
              );
              await supabaseAdmin.from("winam_subscriptions").insert({
                player_id: playerId,
                plan: "daily",
                status: "active",
                valid_until: watEndOfDay(),
              });
            }
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
              return Response.json(
                { success: false, error: "Failed to create account" },
                { status: 500 }
              );
            }
            playerId = newPlayer.id;
            isNewPlayer = true;

            await supabaseAdmin.from("winam_subscriptions").insert({
              player_id: playerId,
              plan: "daily",
              status: "active",
              valid_until: watEndOfDay(),
            });
          }

          const needsOnboarding =
            isNewPlayer || !existingPlayer?.nickname;

          // Build the session cookie and redirect
          const cookie = buildSessionCookie({
            playerId,
            msisdnLast4: last4,
            nickname: existingPlayer?.nickname ?? null,
          });

          const redirectTo = needsOnboarding ? "/onboarding" : "/";
          console.log(
            `[auth-complete] Setting session cookie for ${playerId}, redirecting to ${redirectTo}`
          );

          return new Response(null, {
            status: 303,
            headers: {
              Location: redirectTo,
              "Set-Cookie": cookie,
            },
          });
        } catch (err: any) {
          console.error("[auth-complete] Error:", err);
          return Response.json(
            { success: false, error: err?.message || "Server error" },
            { status: 500 }
          );
        }
      },
    },
  },
});
