"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Check, X, ArrowLeft, Heart, ScrollText, Globe, ArrowRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import AutoAdvanceRing from "@/components/games/AutoAdvanceRing";
import DrawLockBanner from "@/components/games/DrawLockBanner";
import GameHeader from "@/components/games/GameHeader";
import { useGameSession } from "@/hooks/useGameSession";
import { sessionStore } from "@/lib/session";
import { playCorrect, playIncorrect } from "@/lib/sound";

const WISDOM_HINT_TIERS = [
  { tier: 1, label: "Eliminate 2", cost: 25 },
  { tier: 2, label: "First letter", cost: 75 },
  { tier: 3, label: "Reveal", cost: 150 },
] as const;

export default function WisdomDropPage() {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [starting, setStarting] = useState(false);

  const game = useGameSession({
    playerId: playerId ?? "",
    gameType: "wisdomdrop",
    coinBalance,
    onCoinBalanceChange: setCoinBalance,
  });

  useEffect(() => {
    const session = sessionStore.get();
    if (!session?.player.id) {
      router.push("/login");
      return;
    }
    setPlayerId(session.player.id);
    setCoinBalance(session.player.coins ?? 0);
  }, [router]);

  useEffect(() => {
    if (game.feedback === "correct") playCorrect();
    else if (game.feedback === "wrong") playIncorrect();
  }, [game.feedback]);

  const wisdomPuzzle =
    game.currentPuzzle && game.currentPuzzle.gameType === "wisdomdrop"
      ? game.currentPuzzle
      : null;

  const eliminatedOptions = game.hintData?.eliminate
    ? game.hintData.eliminate.split(",")
    : [];

  const revealedAnswer = game.hintData?.answer ?? null;
  const correctAnswer = game.lastReveal?.blank ?? null;
  const selectedAnswer = game.lastReveal?.selectedAnswer ?? null;

  const normalize = useCallback((s: string) => s.trim().replace(/\s+/g, " ").toLowerCase(), []);

  const isGameOver = game.lives <= 0 || game.puzzleNumber >= game.totalPuzzles;

  if (playerId && !game.sessionId) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl z-0"
        />
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="absolute left-4 top-4 z-20 h-10 w-10 rounded-xl bg-surface-1/70 backdrop-blur border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>

        <div className="relative z-10 px-6 pt-24 pb-10 flex flex-col items-center min-h-[100dvh]">
          <div className="relative mb-7">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl" aria-hidden />
            <div className="relative h-24 w-24 rounded-full border border-primary/40 bg-gradient-to-br from-surface-2 to-surface-1 shadow-glow flex items-center justify-center">
              <BookOpen className="h-11 w-11 text-primary" strokeWidth={1.75} />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-primary">WisdomDrop</h1>
          <p className="mt-3 text-sm italic text-muted-foreground text-center max-w-[280px] leading-relaxed">
            Finish the proverb. Inherit the wisdom.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Heart className="h-3.5 w-3.5 text-destructive" />
              <span className="tabular-nums">3 lives</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <ScrollText className="h-3.5 w-3.5 text-primary" />
              <span className="tabular-nums">10 proverbs</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Globe className="h-3.5 w-3.5 text-primary" />
              <span>9 regions</span>
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center w-full py-4">
            <div className="w-full max-w-[280px] rounded-xl bg-surface-1 border border-border p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Example</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                &ldquo;A child who is not taught at home will teach the village a ____&rdquo;
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {["lesson", "song", "dance", "game"].map((opt) => (
                  <div
                    key={opt}
                    className="h-7 rounded-lg border border-border bg-surface-2 flex items-center justify-center text-[11px] text-muted-foreground"
                  >
                    {opt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full max-w-[320px] rounded-2xl bg-surface-1/70 backdrop-blur border border-border p-4 shadow-card mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-coin/15 border border-coin/20 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5 text-coin" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Earn up to <span className="text-coin tabular-nums">5 tickets</span> per round
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plus XP, streak bonuses &amp; weekly draws
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setStarting(true); game.startGame(); }}
            disabled={starting}
            className="group relative h-14 w-full max-w-[320px] rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-glow disabled:opacity-50 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            <span className="relative inline-flex items-center justify-center gap-2">
              {starting ? "Starting..." : (
                <>Start Game <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
              )}
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (!playerId || game.phase === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[430px] flex-col overflow-hidden bg-background">
      <GameHeader
        puzzleIndex={game.puzzleNumber - 1}
        totalPuzzles={game.totalPuzzles}
        elapsedMs={game.elapsedMs}
        lives={game.lives}
        maxLives={game.maxLives}
        onExit={game.exitSession}
      />

      <DrawLockBanner />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-8 space-y-4 scrollbar-hidden">
        {wisdomPuzzle && (
          <div className="rounded-2xl bg-surface-1 border border-border shadow-card overflow-hidden">
            <div className="p-6">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <Globe className="h-3 w-3" />
                  {wisdomPuzzle.region}
                </span>
              </div>
              <p className="text-lg font-medium leading-relaxed text-foreground">
                &ldquo;{wisdomPuzzle.displayText}&rdquo;
              </p>
            </div>

            <AnimatePresence>
              {!game.feedback && game.hintData && (game.hintData.startsWidth || game.hintData.answer) && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mx-6 mb-4 rounded-lg bg-coin/10 border border-coin/20 px-3 py-2 flex items-center gap-2"
                >
                  <div className="min-w-0 flex-1">
                    {game.hintData.answer ? (
                      <p className="text-xs font-semibold text-foreground">
                        Answer revealed · Tap <span className="text-coin">&ldquo;{game.hintData.answer}&rdquo;</span>
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-foreground">
                        Starts with <span className="text-coin text-base font-extrabold">{game.hintData.startsWidth}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-4 pb-4 grid grid-cols-1 gap-3">
              {wisdomPuzzle.options.map((option, i) => {
                const isEliminated = eliminatedOptions.includes(option);
                const isThisCorrect = !!correctAnswer && normalize(option) === normalize(correctAnswer);
                const isThisSelected = !!selectedAnswer && normalize(option) === normalize(selectedAnswer);
                const showState = !!game.feedback;
                const isWrongSelected = showState && isThisSelected && !isThisCorrect;
                const isOtherWrong = showState && !isThisSelected && !isThisCorrect;
                const isRevealed = !showState && !!revealedAnswer && normalize(option) === normalize(revealedAnswer);

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => game.onSquareClick(option)}
                    disabled={game.isSubmitting || isEliminated || showState}
                    className={cn(
                      "h-14 rounded-xl text-sm font-semibold transition-all border min-h-[44px] inline-flex items-center justify-center gap-2",
                      showState && isThisCorrect && "bg-success/15 border-success/40 text-success",
                      isWrongSelected && "bg-destructive/15 border-destructive/40 text-destructive",
                      isOtherWrong && "bg-surface-1/40 border-border/40 text-muted-foreground/50",
                      isEliminated && "bg-surface-1/30 border-border/30 text-muted-foreground/30 line-through cursor-not-allowed",
                      isRevealed && !showState && "bg-success/10 border-success/40 text-success ring-1 ring-success/30",
                      !showState && !isEliminated && !isRevealed && "bg-surface-1 border-border text-foreground hover:border-primary/40 active:scale-[0.98]"
                    )}
                  >
                    {showState && isThisCorrect && <Check className="h-4 w-4" />}
                    {isWrongSelected && <X className="h-4 w-4" />}
                    {option}
                  </button>
                );
              })}
            </div>

            <AnimatePresence initial={false}>
              {game.feedback && game.lastReveal && (
                <motion.div
                  key="reveal"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    "border-t px-6 py-4 space-y-2",
                    game.feedback === "correct" ? "border-success/20 bg-success/5" : "border-destructive/20 bg-destructive/5"
                  )}>
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold",
                      game.feedback === "correct" ? "text-success" : "text-destructive"
                    )}>
                      {game.feedback === "correct" ? (
                        <><Check className="h-3.5 w-3.5" /> Correct</>
                      ) : (
                        <>
                          <X className="h-3.5 w-3.5" /> Not quite
                          {selectedAnswer && (
                            <span className="ml-1 text-muted-foreground font-normal">
                              — you chose: <span className="text-foreground font-semibold">{selectedAnswer}</span>
                              {" · "}
                            </span>
                          )}
                          <span className="ml-1 text-muted-foreground font-normal">
                            answer: <span className="text-foreground font-semibold">{game.lastReveal.blank}</span>
                          </span>
                        </>
                      )}
                    </div>
                    {game.lastReveal.originalProverb && (
                      <p className="text-sm italic text-foreground/90 leading-relaxed">
                        &ldquo;{game.lastReveal.originalProverb}&rdquo;
                      </p>
                    )}
                    {game.lastReveal.region && (
                      <p className="text-xs text-muted-foreground/80">— {game.lastReveal.region}</p>
                    )}
                    {game.lastReveal.explanation && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 pt-1">
                        {game.lastReveal.explanation}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {game.feedback === "correct" && (
          <button
            type="button"
            onClick={game.skipAdvance}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-glow"
          >
            <AutoAdvanceRing durationMs={game.autoAdvanceMs ?? 4000} />
            {isGameOver ? "See Results" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
        {game.feedback === "wrong" && (
          <button
            type="button"
            onClick={game.skipAdvance}
            className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-1 text-base font-semibold text-foreground hover:border-primary/40 transition-all"
          >
            {isGameOver ? "See Results" : "Continue"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        {!game.feedback && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold">Need a hint?</p>
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-coin" />
                <span className="text-xs font-semibold text-coin tabular-nums">Coins: {coinBalance}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {WISDOM_HINT_TIERS.map(({ tier, label, cost }) => {
                const purchased = game.hintTierUsed >= tier;
                const locked = tier > game.hintTierUsed + 1;
                const canAfford = coinBalance >= cost;
                const disabled = purchased || locked || !canAfford || game.isSubmitting;
                return (
                  <button
                    key={tier}
                    type="button"
                    disabled={disabled}
                    onClick={() => game.requestHint(tier)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-all border min-h-[72px]",
                      purchased && "bg-success/10 border-success/30 text-success",
                      locked && "bg-surface-1/30 border-border/30 text-muted-foreground/40 cursor-not-allowed opacity-40",
                      !canAfford && !purchased && !locked && "bg-surface-1/50 border-border/40 text-muted-foreground/50 cursor-not-allowed opacity-50",
                      !purchased && !locked && canAfford && "bg-primary/10 border-primary/40 text-foreground hover:bg-primary/20 hover:border-primary/60 active:scale-95"
                    )}
                  >
                    {purchased ? <Check className="w-4 h-4" /> : null}
                    <span className="font-semibold">{label}</span>
                    <span className="text-[10px] opacity-70">{purchased ? "Used" : `${cost} coins`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
