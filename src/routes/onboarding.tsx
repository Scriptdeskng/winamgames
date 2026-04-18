import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { setNickname } from "@/utils/auth.functions";
import { getSession, updateSessionNickname } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({
    meta: [{ title: "Choose Nickname — WinamGames" }],
  }),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [playerId, setPlayerId] = useState("");
  const [nickname, setNicknameValue] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 3) { setError("At least 3 characters"); return; }
    if (trimmed.length > 16) { setError("Maximum 16 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setError("Letters, numbers, and underscores only"); return; }

    setLoading(true);
    try {
      const result = await setNickname({ data: { playerId, nickname: trimmed } });
      if (!result.success) {
        setError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }
      updateSessionNickname(trimmed);
      navigate({ to: "/" });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!playerId) return null;

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="rounded-2xl border border-border bg-surface-1 shadow-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Choose your name</h1>
              <p className="text-xs text-muted-foreground">This is how others see you</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => { setNicknameValue(e.target.value); setError(""); }}
                placeholder="e.g. NaijaChamp"
                autoFocus
                maxLength={16}
                className="h-11 rounded-xl bg-surface-2 border-border"
              />
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">3–16 chars · letters, numbers, underscores</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || nickname.trim().length < 3}
              className="w-full h-12 rounded-xl shadow-glow"
            >
              {loading ? "Saving..." : "Let's play"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
