import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { sendOtp, verifyOtp } from "@/utils/auth.functions";
import { setSession } from "@/lib/session";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({ meta: [{ title: "Verify OTP — WinamGames" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    msisdn: (search.msisdn as string) || "",
  }),
});

const RESEND_SECONDS = 25;

function VerifyPage() {
  const { msisdn } = Route.useSearch();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const last4 = msisdn.slice(-4);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 4) return;

    setLoading(true);
    setError("");
    try {
      const result = await verifyOtp({ data: { msisdn, code: otp } });
      if (!result.success) {
        setError(result.error || "Verification failed. Try again.");
        setLoading(false);
        return;
      }

      setSession({
        playerId: result.playerId!,
        msisdnLast4: result.msisdnLast4!,
        nickname: null,
      });

      navigate({ to: result.needsOnboarding ? "/onboarding" : "/" });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp("");
    setError("");
    try {
      const result = await sendOtp({ data: { msisdn } });
      if (!result.success) {
        setError(result.error || "Failed to resend OTP");
      } else {
        setCountdown(RESEND_SECONDS);
      }
    } catch {
      setError("Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col pt-16 px-5 pb-10">
        <div className="w-full max-w-sm mx-auto space-y-8">
          <Link to="/" className="block text-lg font-bold text-gradient-emerald">
            WinamGames
          </Link>

          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </Link>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-foreground">Enter your code</h1>
              <p className="text-sm text-muted-foreground">
                We sent a code to •••{last4}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-14 h-14 text-2xl font-semibold bg-surface-2 text-foreground border-border first:rounded-l-xl last:rounded-r-xl"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || otp.length !== 4}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-glow transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify →"}
            </button>

            <div className="pt-2">
              {countdown > 0 ? (
                <p className="text-center text-xs text-muted-foreground">
                  Resend in {countdown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="w-full text-center text-xs text-primary hover:underline"
                >
                  Didn't get a code? Resend →
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
