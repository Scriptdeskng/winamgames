/**
 * POST /api/auth-session-update
 *
 * Updates the session cookie (e.g. after setting nickname)
 * and redirects to the target URL.
 */
import { createFileRoute } from "@tanstack/react-router";
import { readSession, buildSessionCookie } from "@/utils/session.server";

export const Route = createFileRoute("/api/auth-session-update")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const session = readSession(request);
          if (!session) {
            return new Response(null, {
              status: 303,
              headers: { Location: "/login" },
            });
          }

          const body = await request.json();
          const nickname = body?.nickname ?? session.nickname;
          const redirectTo = body?.redirectTo ?? "/";

          const cookie = buildSessionCookie({
            ...session,
            nickname,
          });

          console.log(
            `[auth-session-update] Updated session for ${session.playerId}, redirect to ${redirectTo}`
          );

          return new Response(null, {
            status: 303,
            headers: {
              Location: redirectTo,
              "Set-Cookie": cookie,
            },
          });
        } catch (err: any) {
          console.error("[auth-session-update] Error:", err);
          return Response.json(
            { success: false, error: err?.message || "Server error" },
            { status: 500 }
          );
        }
      },
    },
  },
});
