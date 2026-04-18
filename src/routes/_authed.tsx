import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";
import { getSubscriptionStatus } from "@/utils/session.functions";

export const Route = createFileRoute("/_authed")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      const session = getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      try {
        const sub = await getSubscriptionStatus({ data: { playerId: session.playerId } });
        if (!sub.active) {
          navigate({ to: "/renew" });
          return;
        }
      } catch {
        // If subscription check fails, allow through for now
      }
      setReady(true);
    };
    check();
  }, [navigate]);

  if (!ready) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <Outlet />;
}
