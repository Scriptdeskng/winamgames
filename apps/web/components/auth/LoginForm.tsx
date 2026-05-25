"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPlayerSession, sendOtp } from "@/lib/api";
import { sessionStore } from "@/lib/session";

export interface LoginFormProps {
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

const MSISDN_REGEX = /^0[789]\d{9}$/;

export default function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const [msisdn, setMsisdn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void getPlayerSession()
      .then((result) => {
        if (result.valid && result.player) {
          sessionStore.set({
            player: {
              id: result.player.id,
              msisdn_hash: "",
              nickname: result.player.nickname ?? "Player",
              coins: result.player.coinBalance ?? 0,
              xp: result.player.xpTotal ?? 0,
              rank: result.player.rankTier ?? "starter",
              streak: result.player.currentStreak ?? 0,
              streak_last_date: null,
              created_at: result.player.createdAt ?? new Date().toISOString(),
            },
            expires_at: new Date((result.expiresAt ?? Date.now() / 1000) * 1000).toISOString(),
          });
          router.replace("/app");
        }
      })
      .catch(() => {
        // ignore session bootstrap errors
      });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!MSISDN_REGEX.test(msisdn.trim())) {
      setError("Enter a valid Nigerian mobile number");
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(msisdn.trim());
      if (!result.success) {
        throw new Error(result.message ?? "Failed to send code");
      }
      window.sessionStorage.setItem("winam_pending_phone", msisdn.trim());
      router.push("/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={["flex min-h-[100dvh] flex-col bg-background", className].filter(Boolean).join(" ")}
    >
      <header className="px-5 pt-5">
        <p className="text-2xl font-bold text-primary">WinAm</p>
      </header>

      <motion.div
        className="flex flex-1 items-center justify-center px-5 pb-10"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-sm space-y-6">
          <motion.div className="text-center" variants={itemVariants}>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your number to access your account
            </p>
          </motion.div>

          <motion.form className="space-y-4" onSubmit={handleSubmit} variants={itemVariants}>
            <div className="space-y-1">
              <label htmlFor="login-msisdn" className="text-xs text-muted-foreground">
                Phone number
              </label>
              <input
                id="login-msisdn"
                type="tel"
                placeholder="08012345678"
                autoFocus
                value={msisdn}
                onChange={(e) => {
                  setMsisdn(e.target.value);
                  setError("");
                }}
                className="h-12 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {error ? (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading || !msisdn.trim()}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                "Send code →"
              )}
            </button>
          </motion.form>

          <motion.p className="text-center text-xs text-muted-foreground" variants={itemVariants}>
            Don&apos;t have an account?{" "}
            <Link href="/renew" className="text-primary">
              Subscribe
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
