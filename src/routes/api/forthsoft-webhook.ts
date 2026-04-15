import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/forthsoft-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const FORTHSOFT_WEBHOOK_SECRET = process.env.FORTHSOFT_WEBHOOK_SECRET ?? '';

        const receivedSignature = request.headers.get("x-webhook-signature") ?? "";
        const rawBody = await request.text();

        // HMAC-SHA256 validation — works with placeholder secret in dev,
        // will work with real secret when swapped in
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(FORTHSOFT_WEBHOOK_SECRET),
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign", "verify"]
        );
        const bodyBytes = encoder.encode(rawBody);
        const expectedSig = await crypto.subtle.sign("HMAC", key, bodyBytes);
        const expectedHex = Array.from(new Uint8Array(expectedSig))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        if (expectedHex !== receivedSignature) {
          return new Response("Unauthorized", { status: 401 });
        }

        // Parse and process payload
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          return new Response("Bad Request", { status: 400 });
        }

        // TODO: Process subscription events from Forthsoft
        // Expected payload shape: { event, msisdn, plan, status, carrier_ref }
        // On "subscription.activated" → upsert winam_subscriptions with status: 'active'
        // On "subscription.cancelled" → update winam_subscriptions with status: 'cancelled'
        // On "subscription.renewed" → update valid_until + last_billed_at
        console.log("[Forthsoft Webhook] Received event:", JSON.stringify(payload));

        return Response.json({ received: true }, { status: 200 });
      },
      OPTIONS: async () => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Webhook-Signature",
          },
        });
      },
    },
  },
});
