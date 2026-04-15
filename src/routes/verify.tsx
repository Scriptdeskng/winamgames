import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Verify OTP — WinamGames" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    msisdn: (search.msisdn as string) || "",
  }),
});

function VerifyPage() {
  const navigate = useNavigate();
  const { msisdn } = Route.useSearch();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const last4 = msisdn.slice(-4);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
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
    if (code.length !== 6) return;

    setLoading(true);
    setError("");
    try {
      // TODO: Call verify-otp server function
      console.log("Verifying OTP:", code, "for:", msisdn);
      navigate({ to: "/onboarding" });
    } catch {
      setError("Invalid or expired OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col">
      <div className="px-4 pt-4">
        <Link to="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Verify your number</h1>
            <p className="text-sm text-muted-foreground">Code sent to ****{last4}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="h-14 w-12 rounded-xl bg-surface-1 border border-glass-border text-center text-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            ))}
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <button className="mt-4 text-sm text-primary text-center w-full hover:underline">
          Resend code
        </button>
      </div>
    </div>
  );
}
