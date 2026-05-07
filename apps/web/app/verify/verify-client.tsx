"use client";

import { useEffect, useMemo, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/api";
import { setSession } from "@/lib/session";

const RESEND_SECONDS = 25;
const OTP_LENGTH = 6;

export default function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const msisdn = useMemo(() => searchParams.get("msisdn") ?? "", [searchParams]);
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!msisdn) {
      router.replace("/login");
    }
  }, [msisdn, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const code = otp.join("");
  const last4 = msisdn.slice(-4);

  const updateDigit = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    setOtp((current) => {
      const next = [...current];
      if (digits.length > 1) {
        const pasted = digits.slice(0, OTP_LENGTH).split("");
        pasted.forEach((digit, offset) => {
          if (index + offset < OTP_LENGTH) {
            next[index + offset] = digit;
          }
        });
        return next;
      }
      next[index] = digits.slice(-1);
      return next;
    });

    if (digits && index < OTP_LENGTH - 1) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null;
      prevInput?.focus();
    }
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH - index);
    if (!pasted) return;
    event.preventDefault();

    setOtp((current) => {
      const next = [...current];
      pasted.split("").forEach((digit, offset) => {
        if (index + offset < OTP_LENGTH) {
          next[index + offset] = digit;
        }
      });
      return next;
    });

    const focusIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
    const nextInput = document.getElementById(`otp-${focusIndex}`) as HTMLInputElement | null;
    nextInput?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== OTP_LENGTH) return;

    setLoading(true);
    setError("");
    try {
      const result = await verifyOtp(msisdn, code);
      if (!result.success) {
        setError(result.message || result.error || "Verification failed. Try again.");
        return;
      }

      setSession({
        playerId: result.playerId!,
        msisdnLast4: result.msisdnLast4!,
        nickname: null,
        msisdn: result.msisdn,
        subscriptionActive: !!result.hasActiveSubscription,
        subscriptionRedirectUrl: result.redirectUrl ?? "/renew",
      });

      if (!result.hasActiveSubscription) {
        router.push("/renew");
        return;
      }

      router.push(result.needsOnboarding ? "/onboarding" : "/app");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    setError("");
    try {
      const result = await sendOtp(msisdn);
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
    <main className="min-h-[100dvh] bg-background flex flex-col">
      <div className="px-5 pt-5">
        <Link href="/" aria-label="WinamGames home">
          <img src="/winam-logo.png" alt="WinamGames" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Enter your code</h1>
            <p className="text-sm text-muted-foreground">We sent a 6-digit code to •••{last4}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => updateDigit(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={(e) => handlePaste(index, e)}
                  className="w-12 h-14 rounded-xl bg-surface-2 border border-border text-center text-2xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ))}
            </div>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length !== OTP_LENGTH}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-glow transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify →"}
            </button>

            {countdown > 0 ? (
              <p className="text-center text-xs text-muted-foreground">Resend in {countdown}s</p>
            ) : (
              <button type="button" onClick={handleResend} className="w-full text-center text-xs text-primary hover:underline">
                Didn't get a code? Resend →
              </button>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
