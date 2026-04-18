import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Crown, Clock, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/session";
import { renewSubscription } from "@/utils/auth.functions";
import { Button } from "@/components/ui/button";
import { AuthFrame } from "@/components/auth/AuthFrame";

export const Route = createFileRoute("/renew")({
  component: RenewPage,
  head: () => ({
    meta: [{ title: "Renew Subscription — WinamGames" }],
  }),
});

function RenewPage() {
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState("");
  const [selected, setSelected] = useState<"daily" | "weekly">("weekly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      navigate({ to: "/login" });
      return;
    }
    setPlayerId(session.playerId);
  }, [navigate]);

  const handleSubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await renewSubscription({ data: { playerId, plan: selected } });
      if (!result.success) {
        setError(result.error || "Something went wrong");
        return;
      }
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!playerId) return null;

  return (
    <AuthFrame back={{ to: "/profile" }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Renew subscription</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep playing & earning entries
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setSelected("weekly")}
          className={`relative w-full rounded-2xl border-2 p-5 text-left transition-all ${
            selected === "weekly"
              ? "border-primary bg-primary/5 shadow-glow"
              : "border-border bg-surface-2 hover:border-primary/40"
          }`}
        >
          <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-wide uppercase">Best Value</div>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">Weekly</span>
              </div>
              <p className="text-sm text-muted-foreground">7 days of full access</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">₦42.86/day — save 71%</span>
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

        <button
          onClick={() => setSelected("daily")}
          className={`w-full rounded-2xl border-2 p-5 text-left transition-all ${
            selected === "daily"
              ? "border-primary bg-primary/5 shadow-glow"
              : "border-border bg-surface-2 hover:border-primary/40"
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

      {error && <p className="mt-4 text-sm text-destructive text-center">{error}</p>}

      <Button
        onClick={handleSubscribe}
        disabled={loading}
        size="lg"
        className="mt-6 w-full h-12 rounded-xl shadow-glow"
      >
        {loading ? "Activating..." : `Subscribe — ${selected === "weekly" ? "₦300/week" : "₦150/day"}`}
      </Button>

      <p className="mt-4 text-xs text-muted-foreground text-center">MTN Nigeria carrier billing • Cancel anytime</p>
    </AuthFrame>
  );
}
