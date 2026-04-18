import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Crown, Clock, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/session";
import { renewSubscription } from "@/utils/auth.functions";
import { useAllowScroll } from "@/hooks/useAllowScroll";

export const Route = createFileRoute("/renew")({
  component: RenewPage,
  head: () => ({ meta: [{ title: "Renew Subscription — WinamGames" }] }),
});

function RenewPage() {
  useAllowScroll();
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-5">
        <Link to="/" className="text-lg font-bold text-gradient-emerald">
          WinamGames
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm space-y-6">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Renew subscription</h1>
            <p className="text-sm text-muted-foreground">
              Keep playing & earning entries
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setSelected("weekly")}
              className={`relative w-full rounded-xl border p-4 text-left transition-all ${
                selected === "weekly"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-input hover:border-primary/40"
              }`}
            >
              <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold tracking-wide uppercase">
                Best Value
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm">Weekly</span>
                  </div>
                  <p className="text-xs text-muted-foreground">7 days of full access</p>
                  <p className="mt-1 text-[10px] text-primary font-semibold">₦42.86/day — save 71%</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold tabular-nums">₦300</span>
                  <p className="text-[10px] text-muted-foreground">/week</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> All games</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> Entries</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> Missions</span>
              </div>
            </button>

            <button
              onClick={() => setSelected("daily")}
              className={`w-full rounded-xl border p-4 text-left transition-all ${
                selected === "daily"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-input hover:border-primary/40"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-sm">Daily</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Access for today only</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold tabular-nums">₦150</span>
                  <p className="text-[10px] text-muted-foreground">/day</p>
                </div>
              </div>
            </button>
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-glow transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `Subscribe — ${selected === "weekly" ? "₦300/week" : "₦150/day"} →`
            )}
          </button>

          <p className="text-center text-[10px] text-muted-foreground">
            MTN Nigeria carrier billing • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
