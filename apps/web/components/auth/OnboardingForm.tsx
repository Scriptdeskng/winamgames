"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updatePlayerNickname } from "@/lib/api";
import { sessionStore } from "@/lib/session";

const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(3, "Nickname must be 3–16 characters")
    .max(16, "Nickname must be 3–16 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only"),
});

export type OnboardingFormValues = z.infer<typeof nicknameSchema>;

export interface OnboardingFormProps {
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

export default function OnboardingForm({ className }: OnboardingFormProps) {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: { nickname: "" },
  });

  const nicknameValue = watch("nickname");
  const isLoading = isSubmitting;
  const isButtonDisabled = isLoading || nicknameValue.trim().length < 3;

  useEffect(() => {
    const session = sessionStore.get();
    if (!session) {
      router.replace("/login");
      return;
    }
    startTransition(() => {
      setPlayerId(session.player.id);
    });
  }, [router]);

  const onSubmit = handleSubmit(async (data) => {
    if (!playerId) return;
    setSubmitError(null);
    try {
      await updatePlayerNickname(playerId, data.nickname.trim());
      const session = sessionStore.get();
      if (session) {
        sessionStore.set({
          ...session,
          player: {
            ...session.player,
            nickname: data.nickname.trim(),
          },
        });
      }
      router.push("/app");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  });

  if (!playerId) {
    return (
      <div
        className={[
          "mx-auto min-h-[100dvh] w-full max-w-[390px] bg-background",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    );
  }

  return (
    <div
      className={[
        "mx-auto flex min-h-[100dvh] w-full max-w-[390px] flex-col bg-background",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="px-5 pt-5">
        <p className="text-2xl font-bold text-primary">WinAm</p>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 pb-10">
        <motion.div
          className="w-full max-w-sm space-y-6"
          variants={listVariants}
          initial="hidden"
          animate="show"
        >
          <motion.div className="text-center" variants={itemVariants}>
            <h1 className="text-2xl font-bold text-foreground">Choose your name</h1>
            <p className="text-sm text-muted-foreground">This is how others will see you</p>
          </motion.div>

          <motion.form className="space-y-4" onSubmit={onSubmit} variants={itemVariants}>
            <motion.div className="space-y-1" variants={itemVariants}>
              <label htmlFor="onboarding-nickname" className="text-xs text-muted-foreground">
                Nickname
              </label>
              <input
                id="onboarding-nickname"
                type="text"
                autoFocus
                maxLength={16}
                placeholder="e.g. NaijaChamp"
                autoComplete="nickname"
                aria-invalid={errors.nickname ? "true" : "false"}
                className="h-12 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("nickname")}
              />
              {errors.nickname?.message ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.nickname.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  3–16 chars · letters, numbers, underscores
                </p>
              )}
              {submitError && !errors.nickname ? (
                <p className="text-xs text-destructive" role="alert">
                  {submitError}
                </p>
              ) : null}
            </motion.div>

            <motion.button
              type="submit"
              disabled={isButtonDisabled}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-90 disabled:opacity-40"
              variants={itemVariants}
            >
              {isLoading ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                "Let's play →"
              )}
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
