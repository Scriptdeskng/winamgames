import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { getCurrentPlayer, getSubscriptionStatus } from "@/utils/session.functions";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const player = await getCurrentPlayer();
    if (!player) {
      throw redirect({ to: "/login" });
    }
    const sub = await getSubscriptionStatus({ data: { playerId: player.playerId } });
    if (!sub.active) {
      throw redirect({ to: "/renew" });
    }
    return {
      playerId: player.playerId,
      msisdnLast4: player.msisdnLast4,
      nickname: player.nickname,
    };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}
