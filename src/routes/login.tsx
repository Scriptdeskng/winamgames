import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Phone, ArrowRight } from "lucide-react";
import { sendOtp } from "@/utils/auth.functions";
import { getSession } from "@/lib/session";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — WinamGames" },
      { name: "description", content: "Enter your phone number to play WinamGames." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [msisdn, setMsisdn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleaned = msisdn.replace(/\s/g, "");
    if (!/^0[789]\d{9}$/.test(cleaned) && !/^\+234[789]\d{9}$/.test(cleaned)) {
      setError("Enter a valid Nigerian mobile number");
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp({ data: { msisdn: cleaned } });
      if (!result.success) {
        setError(result.error || "Failed to send OTP");
        return;
      }
      navigate({ to: "/verify", search: { msisdn: cleaned } });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gradient-emerald">WinamGames</h1>
          <p className="mt-2 text-muted-foreground">Play. Win. Repeat.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="tel"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                placeholder="0801 234 5678"
                className="w-full h-14 pl-11 pr-4 rounded-xl bg-surface-1 border border-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                autoFocus
              />
            </div>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || msisdn.length < 10}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
          >
            {loading ? "Sending..." : "Get OTP"}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>

        <p className="mt-8 text-xs text-center text-muted-foreground leading-relaxed">
          By continuing, you agree to subscribe to WinamGames on MTN Nigeria.
        </p>
      </div>
    </div>
  );
}
