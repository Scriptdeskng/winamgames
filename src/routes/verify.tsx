import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { sendOtp, verifyOtp } from "@/utils/auth.functions";
import { setSession } from "@/lib/session";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [{ title: "Verify OTP — WinamGames" }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    msisdn: (search.msisdn as string) || "",
  }),
});

function VerifyPage() {
  const { msisdn } = Route.useSearch();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 4) return;

    setLoading(true);
    setError("");

    try {
      const result = await verifyOtp({ data: { msisdn, code } });
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
    } catch (err: any) {
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
      }
    } catch {
      setError("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col">
      <div className="px-4 pt-4">
        <Link
          to="/login"
          className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="rounded-2xl border border-border bg-surface-1 shadow-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Verify your number</h1>
              <p className="text-xs text-muted-foreground">
                Enter <span className="font-mono font-bold text-primary">0000</span> to continue
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-12 rounded-xl bg-surface-2 border border-border text-center text-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              ))}
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button
              type="submit"
              size="lg"
              disabled={loading || otp.join("").length !== 4}
              className="w-full h-12 rounded-xl shadow-glow"
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full text-sm text-muted-foreground hover:text-primary text-center disabled:opacity-50 transition-colors"
            >
              {resending ? "Resending..." : "Resend code"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
