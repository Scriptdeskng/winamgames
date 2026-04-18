import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Phone, ArrowRight } from "lucide-react";
import { sendOtp } from "@/utils/auth.functions";
import { getSession } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gradient-emerald">WinamGames</h1>
          <p className="mt-1 text-sm text-muted-foreground">Play. Win. Repeat.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface-1 shadow-card p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">Enter your phone number to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="phone"
                  type="tel"
                  value={msisdn}
                  onChange={(e) => setMsisdn(e.target.value)}
                  placeholder="0801 234 5678"
                  autoFocus
                  className="h-11 pl-10 rounded-xl bg-surface-2 border-border"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || msisdn.length < 10}
              className="w-full h-12 rounded-xl shadow-glow"
            >
              {loading ? "Sending..." : "Get OTP"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-xs text-center text-muted-foreground leading-relaxed">
          By continuing, you agree to subscribe to WinamGames on MTN Nigeria.
        </p>
      </div>
    </div>
  );
}
