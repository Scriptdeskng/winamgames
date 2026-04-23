import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHeader } from "@/components/games/GameHeader";
import { AnswerFooter } from "@/components/games/AnswerFooter";
import { useGameSession } from "@/components/games/useGameSession";
import { DrawLockBanner } from "@/components/games/DrawLockBanner";
import { getPlayerData } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { BookOpen, Check, X, ArrowLeft, Heart, ScrollText, Globe, ArrowRight, Coins, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const WISDOM_HINT_TIERS = [
  { tier: 1, label: "Eliminate 2", cost: 25 },
  { tier: 2, label: "First letter", cost: 75 },
  { tier: 3, label: "Reveal", cost: 150 },
] as const;

export const Route = createFileRoute("/_authed/wisdomdrop")({
  component: WisdomDropPage,
  head: () => ({
    meta: [
      { title: "WisdomDrop — WinamGames" },
      { name: "description", content: "Complete African proverbs and earn draw entries." },
    ],
  }),
});

function WisdomDropPage() {
  const sessionData = getSession();
  const playerId = sessionData?.playerId ?? "";
  const [playerData, setPlayerData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!playerId) return;
    getPlayerData({ data: { playerId } }).then(setPlayerData);
  }, [playerId]);

  const coinBalance = playerData?.success ? playerData.player.coinBalance : 0;
  const session = useGameSession("wisdomdrop", playerId);

  if (!session.sessionId) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-emerald/10 blur-3xl z-0"
        />

        <Link
          to="/app"
          className="absolute left-4 top-4 z-20 h-10 w-10 rounded-xl bg-surface-1/70 backdrop-blur border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>

        <div className="relative z-10 px-6 pt-24 pb-10 flex flex-col items-center min-h-[100dvh]">
          <div className="relative mb-7">
            <div className="absolute inset-0 rounded-full bg-emerald/30 blur-2xl" aria-hidden />
            <div className="relative h-24 w-24 rounded-full border border-emerald/40 bg-gradient-to-br from-surface-2 to-surface-1 shadow-glow flex items-center justify-center">
              <BookOpen className="h-11 w-11 text-emerald" strokeWidth={1.75} />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gradient-emerald">
            WisdomDrop
          </h1>
          <p className="mt-3 text-sm italic text-muted-foreground text-center max-w-[280px] leading-relaxed">
            Finish the proverb. Inherit the wisdom.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Heart className="h-3.5 w-3.5 text-live" />
              <span className="tabular-nums">3 lives</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <ScrollText className="h-3.5 w-3.5 text-xp" />
              <span className="tabular-nums">10 proverbs</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Globe className="h-3.5 w-3.5 text-emerald" />
              <span className="tabular-nums">9 regions</span>
            </span>
          </div>

          <div className="flex-1 min-h-6" />

          <div className="w-full max-w-[320px] rounded-2xl bg-surface-1/70 backdrop-blur border border-border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-coin/15 border border-coin/20 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5 text-coin" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Earn up to <span className="text-coin tabular-nums">5 entries</span> per round
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plus XP, streak bonuses & weekly draws
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => session.start(coinBalance)}
            disabled={session.loading}
            className="group relative mt-4 h-14 w-full max-w-[320px] rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-glow disabled:opacity-50 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            <span className="relative inline-flex items-center justify-center gap-2">
              {session.loading ? "Starting..." : (
                <>
                  Start Game
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const puzzle = session.currentPuzzle as {
    puzzleId: string;
    displayText: string;
    options: string[];
    region: string;
  } | null;

  const eliminatedOptions = session.hintData?.eliminate
    ? session.hintData.eliminate.split(",")
    : [];

  const isCorrect = session.feedback === "correct";
  const correctAnswer = session.lastReveal?.blank;
  const selectedAnswer = session.selectedAnswer;
  const revealedAnswer = session.hintData?.answer ?? null;
  const normalize = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <GameHeader
        title="WisdomDrop"
        lives={session.lives}
        startTime={session.startTime}
        running={session.running}
        puzzleIndex={session.currentPuzzleIndex}
        totalPuzzles={session.totalPuzzles}
        onExit={session.exitEarly}
      />

      <div className="px-4 pt-6 pb-8 space-y-4">
        <DrawLockBanner />

        {puzzle && (
          <div className="rounded-2xl bg-surface-1 border border-border shadow-card overflow-hidden">
            {/* Proverb prompt */}
            <div className="p-6">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 border border-emerald/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald">
                  <Globe className="h-3 w-3" />
                  {puzzle.region}
                </span>
              </div>
              <p className="text-lg font-medium leading-relaxed text-foreground">
                "{puzzle.displayText}"
              </p>
            </div>

            {/* Premium hint chip */}
            <AnimatePresence>
              {!session.feedback && session.hintData && (session.hintData.startsWidth || session.hintData.answer) && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mx-6 mb-4 rounded-xl bg-gradient-to-br from-coin/15 to-coin/5 border border-coin/30 p-3 flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-lg bg-coin/20 border border-coin/30 flex items-center justify-center shrink-0">
                    <Lightbulb className="h-5 w-5 text-coin" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {session.hintData.answer ? (
                      <>
                        <p className="text-[11px] uppercase tracking-wide text-coin/80 font-semibold">Answer revealed</p>
                        <p className="text-sm font-bold text-foreground truncate">Tap "{session.hintData.answer}"</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] uppercase tracking-wide text-coin/80 font-semibold">Starts with</p>
                        <p className="text-2xl font-extrabold text-coin tabular-nums leading-none mt-0.5">{session.hintData.startsWidth}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Choices */}
            <div className="px-4 pb-4 grid grid-cols-1 gap-3">
              {puzzle.options.map((option, i) => {
                const isEliminated = eliminatedOptions.includes(option);
                const isThisCorrect = !!correctAnswer && normalize(option) === normalize(correctAnswer);
                const isThisSelected = !!selectedAnswer && normalize(option) === normalize(selectedAnswer);
                const showState = !!session.feedback;
                const isChecking = session.loading && isThisSelected && !showState;
                const isWrongSelected = showState && isThisSelected && !isThisCorrect;
                const isOtherWrong = showState && !isThisSelected && !isThisCorrect;

                return (
                  <button
                    key={i}
                    onClick={() => session.submit(option)}
                    disabled={session.loading || session.gameOver || isEliminated || showState}
                    className={cn(
                      "h-14 rounded-xl text-sm font-semibold transition-all border min-h-[44px] inline-flex items-center justify-center gap-2",
                      showState && isThisCorrect && "bg-success/15 border-success/40 text-success",
                      isWrongSelected && "bg-live/15 border-live/40 text-live",
                      isOtherWrong && "bg-surface-1/40 border-border/40 text-muted-foreground/50",
                      isChecking && "bg-surface-1 border-primary/60 text-foreground shadow-glow",
                      !showState && !isChecking && isEliminated && "bg-surface-1/30 border-border/30 text-muted-foreground/30 line-through cursor-not-allowed",
                      !showState && !isChecking && !isEliminated && "bg-surface-1 border-border text-foreground hover:border-primary/40 hover:shadow-glow active:scale-[0.98]"
                    )}
                  >
                    {showState && isThisCorrect && <Check className="h-4 w-4" />}
                    {isWrongSelected && <X className="h-4 w-4" />}
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Inline reveal — animated open below the choices */}
            <AnimatePresence initial={false}>
              {session.feedback && (
                <motion.div
                  key="reveal"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      "border-t px-6 py-4 space-y-2",
                      isCorrect ? "border-success/20 bg-success/5" : "border-live/20 bg-live/5"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-xs font-semibold",
                        isCorrect ? "text-success" : "text-live"
                      )}
                    >
                      {isCorrect ? (
                        <><Check className="h-3.5 w-3.5" /> Correct</>
                      ) : (
                        <><X className="h-3.5 w-3.5" /> Not quite</>
                      )}
                      {!isCorrect && session.lastReveal && (
                        <span className="ml-1 text-muted-foreground font-normal">
                          {selectedAnswer && (
                            <>
                              — you chose:{" "}
                              <span className="text-foreground font-semibold">{selectedAnswer}</span>
                              {" · "}
                            </>
                          )}
                          {!selectedAnswer && "— "}
                          answer: <span className="text-foreground font-semibold">{session.lastReveal.blank}</span>
                        </span>
                      )}
                    </div>

                    {session.lastReveal && (
                      <>
                        <p className="text-sm italic text-foreground/90 leading-relaxed">
                          "{session.lastReveal.originalProverb}"
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          — {session.lastReveal.region}
                        </p>
                        {session.lastReveal.explanation && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 pt-1">
                            {session.lastReveal.explanation}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <AnswerFooter
          feedback={session.feedback}
          isLastPuzzle={session.isLastPuzzle}
          isGameOver={session.gameOver}
          autoAdvanceMs={session.autoAdvanceMs}
          onAdvance={session.advance}
        />

        {!session.feedback && (
          <HintButton
            currentTier={session.currentHintTier}
            coinBalance={session.coinBalance}
            onUseHint={session.requestHint}
            disabled={session.loading || session.gameOver}
          />
        )}
      </div>
    </div>
  );
}
