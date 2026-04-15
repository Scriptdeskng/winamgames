import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AlertTriangle, Crown, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { getCurrentPlayer } from "@/utils/session.functions";
import { renewSubscription } from "@/utils/auth.functions";

export const Route = createFileRoute("/renew")({
  component: RenewPage,
  beforeLoad: async () => {
    const player = await getCurrentPlayer();
    if (!player) {
      throw redirect({ to: "/login" });
    }
    return { playerId: player.playerId };
  },
  head: () => ({
    meta: [{ title: "Renew Subscription — WinamGames" }],
  }),
});

function RenewPage() {
  const { playerId } = Route.useRouteContext();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"daily" | "weekly">("weekly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await renewSubscription({ data: { playerId, plan: selected } });
      if (!result.success) {
        setError(result.error || "Something went wrong");
        return;
      }
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-12 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-warning/15 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Subscription Inactive</h1>
            <p className="text-sm text-muted-foreground">
              Renew to keep playing & earning entries
            </p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="space-y-3">
          {/* Weekly — recommended */}
          <button
            onClick={() => setSelected("weekly")}
            className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all ${
              selected === "weekly"
                ? "border-primary bg-primary/5 shadow-glow"
                : "border-glass-border bg-surface-1 hover:border-primary/40"
            }`}
          >
            <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide uppercase">
              Best Value
            </div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">Weekly</span>
                </div>
                <p className="text-sm text-muted-foreground">7 days of full access</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
                    ₦42.86/day — save 71%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tabular-nums">₦300</span>
                <p className="text-xs text-muted-foreground">/week</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> All games</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Draw entries</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Missions</span>
            </div>
          </button>

          {/* Daily */}
          <button
            onClick={() => setSelected("daily")}
            className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
              selected === "daily"
                ? "border-primary bg-primary/5 shadow-glow"
                : "border-glass-border bg-surface-1 hover:border-primary/40"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="font-bold text-lg">Daily</span>
                </div>
                <p className="text-sm text-muted-foreground">Access for today only</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold tabular-nums">₦150</span>
                <p className="text-xs text-muted-foreground">/day</p>
              </div>
            </div>
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-destructive text-center">{error}</p>
        )}

        {/* Subscribe button */}
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="mt-8 w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
        >
          {loading ? "Activating..." : `Subscribe — ${selected === "weekly" ? "₦300/week" : "₦150/day"}`}
        </button>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          MTN Nigeria carrier billing • Cancel anytime
        </p>
      </div>
    </div>
  );
}
