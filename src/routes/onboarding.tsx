import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { setNickname } from "@/utils/auth.functions";
import { getCurrentPlayer, setPlayerSession } from "@/utils/session.functions";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  loader: async () => {
    const session = await getCurrentPlayer();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { playerId: session.playerId, msisdnLast4: session.msisdnLast4 };
  },
  head: () => ({
    meta: [{ title: "Choose Nickname — WinamGames" }],
  }),
});

function OnboardingPage() {
  const { playerId, msisdnLast4 } = Route.useLoaderData();
  const navigate = useNavigate();
  const [nickname, setNicknameValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 3) {
      setError("At least 3 characters");
      return;
    }
    if (trimmed.length > 16) {
      setError("Maximum 16 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError("Letters, numbers, and underscores only");
      return;
    }

    setLoading(true);
    try {
      const result = await setNickname({ data: { playerId, nickname: trimmed } });
      if (!result.success) {
        setError(result.error || "Something went wrong");
        return;
      }

      // Update session with nickname
      await setPlayerSession({
        data: { playerId, msisdnLast4: msisdnLast4 ?? "", nickname: trimmed },
      });

      window.location.href = "/";
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Choose your name</h1>
            <p className="text-sm text-muted-foreground">This is how others see you</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => { setNicknameValue(e.target.value); setError(""); }}
              placeholder="e.g. NaijaChamp"
              className="w-full h-14 px-4 rounded-xl bg-surface-1 border border-glass-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              autoFocus
              maxLength={16}
            />
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || nickname.trim().length < 3}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
          >
            {loading ? "Saving..." : "Let's play"}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
