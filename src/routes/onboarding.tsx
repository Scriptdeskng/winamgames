import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { setNickname } from "@/utils/auth.functions";
import { getSession, updateSessionNickname } from "@/lib/session";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import logo from "@/assets/winam-logo.png";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
  head: () => ({ meta: [{ title: "Choose Nickname — WinamGames" }] }),
});

function OnboardingPage() {
  useAllowScroll();
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
      navigate({ to: "/app" });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!playerId) return null;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <div className="px-5 pt-5">
        <Link to="/" aria-label="WinAm home">
          <img src={logo} alt="WinAm" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Choose your name</h1>
            <p className="text-sm text-muted-foreground">
              This is how others will see you
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-xs text-muted-foreground">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => { setNicknameValue(e.target.value); setError(""); }}
                placeholder="e.g. NaijaChamp"
                autoFocus
                maxLength={16}
                className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : (
                <p className="text-xs text-muted-foreground">3–16 chars · letters, numbers, underscores</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || nickname.trim().length < 3}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-glow transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Let's play →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
