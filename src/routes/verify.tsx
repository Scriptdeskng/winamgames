import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { sendOtp, verifyOtp } from "@/utils/auth.functions";
import { setSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AuthFrame } from "@/components/auth/AuthFrame";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [{ title: "Verify OTP — WinamGames" }],
  }),
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
  const [resending, setResending] = useState(false);
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

      if (result.needsOnboarding) {
        navigate({ to: "/onboarding" });
      } else {
        navigate({ to: "/" });
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
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
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthFrame back={{ to: "/login" }}>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Enter your code</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a code to ···{last4}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-center">
          <InputOTP maxLength={4} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} className="h-14 w-12 rounded-xl text-xl" />
              <InputOTPSlot index={1} className="h-14 w-12 rounded-xl text-xl" />
              <InputOTPSlot index={2} className="h-14 w-12 rounded-xl text-xl" />
              <InputOTPSlot index={3} className="h-14 w-12 rounded-xl text-xl" />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <Button
          type="submit"
          size="lg"
          disabled={loading || otp.length !== 4}
          className="w-full h-12 rounded-xl shadow-glow"
        >
          {loading ? "Verifying..." : "Verify"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>

        <div className="text-center text-sm">
          {countdown > 0 ? (
            <span className="text-muted-foreground">Resend in {countdown}s</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary font-medium hover:underline disabled:opacity-50"
            >
              {resending ? "Resending..." : "Resend code"}
            </button>
          )}
        </div>
      </form>
    </AuthFrame>
  );
}
