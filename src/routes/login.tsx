import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { sendOtp } from "@/utils/auth.functions";
import { getSession } from "@/lib/session";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import logo from "@/assets/winam-logo.png";

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
  useAllowScroll();
  const navigate = useNavigate();
  const [msisdn, setMsisdn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (session) navigate({ to: "/app" });
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
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <div className="px-5 pt-5">
        <Link to="/" aria-label="WinAm home">
          <img src={logo} alt="WinAm" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your number to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-xs text-muted-foreground">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                placeholder="08012345678"
                autoFocus
                className="w-full h-12 px-4 rounded-xl bg-input border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading || !msisdn.trim()}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-glow transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send code →"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/renew" className="text-primary hover:underline">
              Subscribe
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
