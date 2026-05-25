"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getPlayer, verifyOtp } from "@/lib/api";
import { sessionStore } from "@/lib/session";

export interface VerifyFormProps {
  className?: string;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const OTP_SLOT_CLASS =
  "w-14 h-14 text-2xl font-semibold bg-surface-2 text-foreground border-border first:rounded-l-xl last:rounded-r-xl";

export default function VerifyForm({ className }: VerifyFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(25);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const stored =
      typeof window === "undefined"
        ? null
        : window.sessionStorage.getItem("winam_pending_phone");
    if (!stored) {
      router.replace("/login");
      return;
    }
    startTransition(() => {
      setPhone(stored);
    });
  }, [router]);

  useEffect(() => {
    if (!phone || countdown <= 0) return;
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [phone, countdown]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone) return;

    setError("");
    setLoading(true);
    try {
      const result = await verifyOtp(phone, otp);
      if (!result.success) {
        setError(result.message ?? "Invalid code. Please try again.");
        return;
      }
      window.sessionStorage.removeItem("winam_pending_phone");

      const player = await getPlayer(result.playerId);
      if (player?.nickname && player.nickname !== "Player") {
        sessionStore.set({
          player,
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        });
        router.push("/app");
      } else {
        sessionStore.set({
          player: player ?? {
            id: result.playerId,
            msisdn_hash: "",
            nickname: "",
            coins: 0,
            xp: 0,
            rank: "starter",
            streak: 0,
            streak_last_date: null,
            created_at: new Date().toISOString(),
          },
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        });
        router.push("/onboarding");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCountdown(25);
    setOtp("");
    setError("");
  };

  if (!phone) {
    return (
      <div
        className={["min-h-[100dvh] bg-background", className].filter(Boolean).join(" ")}
      />
    );
  }

  return (
    <div
      className={["flex min-h-[100dvh] flex-col bg-background", className].filter(Boolean).join(" ")}
    >
      <header className="px-5 pt-5">
        <p className="text-2xl font-bold text-primary">WinAm</p>
      </header>

      <Link href="/login" className="px-5 text-xs text-muted-foreground">
        ← Back
      </Link>

      <motion.div
        className="flex flex-1 items-center justify-center px-5 pb-10"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-sm space-y-6">
          <motion.div className="text-center" variants={itemVariants}>
            <h1 className="text-2xl font-bold text-foreground">Enter your code</h1>
            <p className="text-sm text-muted-foreground">We sent a 6-digit code to {phone}</p>
          </motion.div>

          <motion.form className="space-y-6" onSubmit={handleSubmit} variants={itemVariants}>
            <div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className={OTP_SLOT_CLASS} />
                    <InputOTPSlot index={1} className={OTP_SLOT_CLASS} />
                    <InputOTPSlot index={2} className={OTP_SLOT_CLASS} />
                    <InputOTPSlot index={3} className={OTP_SLOT_CLASS} />
                    <InputOTPSlot index={4} className={OTP_SLOT_CLASS} />
                    <InputOTPSlot index={5} className={OTP_SLOT_CLASS} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error ? (
                <p className="text-center text-xs text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                "Verify →"
              )}
            </button>

            <div className="text-center">
              {countdown > 0 ? (
                <span className="text-xs text-muted-foreground">Resend in {countdown}s</span>
              ) : (
                <button type="button" onClick={handleResend} className="text-xs text-primary">
                  Resend code
                </button>
              )}
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
