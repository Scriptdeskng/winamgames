/**
 * POST /api/auth-logout
 *
 * Clears the session cookie and redirects to /login.
 */
import { createFileRoute } from "@tanstack/react-router";
import { buildClearSessionCookie } from "@/utils/session.server";

export const Route = createFileRoute("/api/auth-logout")({
  server: {
    handlers: {
      POST: async () => {
        const cookie = buildClearSessionCookie();
        console.log("[auth-logout] Clearing session, redirecting to /login");
        return new Response(null, {
          status: 303,
          headers: {
            Location: "/login",
            "Set-Cookie": cookie,
          },
        });
      },
    },
  },
});
