"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Coins,
  Users,
  Sparkles,
  Smartphone,
  Gamepad2,
  ArrowRight,
  Hash,
  Calendar,
  Check,
  ChevronDown,
} from "lucide-react";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";
import useAllowScroll from "@/hooks/useAllowScroll";

// ── Nav ───────────────────────────────────────────────────────────────

function StickyNav({ scrolled }: { scrolled: boolean }) {
  return (
    <header
      className={
        scrolled
          ? "sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur-md transition-all duration-300"
          : "sticky top-0 z-50 border-b border-transparent bg-transparent transition-all duration-300"
      }
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <img src="/winam-logo.png" alt="WinamGames" className="h-7 w-auto" />
        </Link>
        <Link
          href="/renew"
          className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-[0_0_16px_color-mix(in oklch, var(--primary) 40%, transparent)] transition-colors hover:bg-primary/90 sm:px-4 sm:text-sm"
        >
          Play now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

// ── Hero visuals ──────────────────────────────────────────────────────

function HeroChessFragment() {
  const rows: Array<Array<{ light: boolean; pieceUrl?: string; highlight?: boolean }>> = [
    [{ light: true }, { light: false }, { light: true, pieceUrl: "https://lichess1.org/assets/piece/staunty/bK.svg" }, { light: false }],
    [{ light: false }, { light: true }, { light: false }, { light: true }],
    [{ light: true }, { light: false, pieceUrl: "https://lichess1.org/assets/piece/staunty/wQ.svg", highlight: true }, { light: true }, { light: false }],
    [{ light: false }, { light: true }, { light: false, pieceUrl: "https://lichess1.org/assets/piece/staunty/wK.svg" }, { light: true }],
  ];

  return (
    <div className="absolute left-0 top-2 w-[68%] max-w-[300px] rotate-[-6deg] sm:top-4 sm:w-[60%]">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="rounded-2xl border border-border bg-[var(--surface-1)] p-3 shadow-[0_4px_24px_color-mix(in oklch, var(--foreground) 6%, transparent)]"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--emerald)]">
            CheckMate
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground">Mate in 1</span>
        </div>
        <div className="grid grid-cols-4 gap-0 overflow-hidden rounded-lg border border-border">
          {rows.map((row, ri) =>
            row.map((cell, ci) => (
              <div
                key={`${ri}-${ci}`}
                className={`relative flex aspect-square items-center justify-center ${
                  cell.light ? "bg-[var(--surface-3)]" : "bg-[var(--surface-2)]"
                } ${cell.highlight ? "ring-2 ring-inset ring-[var(--emerald)]" : ""}`}
              >
                {cell.highlight ? (
                  <span className="absolute inset-0 animate-pulse bg-[var(--emerald)] opacity-0 [animation-duration:2s]" />
                ) : null}
                {cell.pieceUrl ? (
                  <img
                    src={cell.pieceUrl}
                    alt=""
                    className="h-[70%] w-[70%] select-none pointer-events-none"
                    draggable={false}
                  />
                ) : null}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function HeroProverbCard() {
  return (
    <div className="absolute bottom-0 right-0 w-[78%] max-w-[320px] rotate-[4deg] sm:bottom-2 sm:w-[64%]">
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1.8 }}
        className="rounded-2xl border border-border bg-[var(--surface-1)] p-3 shadow-[0_4px_24px_color-mix(in oklch, var(--foreground) 6%, transparent)]"
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--xp)]">
            WisdomDrop
          </span>
          <span className="text-[10px] text-muted-foreground">Yoruba</span>
        </div>
        <p className="mb-3.5 text-sm font-medium leading-relaxed text-foreground sm:text-[15px]">
          A patient{" "}
          <span className="inline-block min-w-[44px] align-middle rounded-md border border-dashed border-[color-mix(in oklch, var(--emerald) 50%, transparent)] px-2 py-0.5 text-center text-xs font-semibold tracking-wider text-[var(--emerald)]">
            ___
          </span>{" "}
          eats ripe fruit.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "lion", correct: false },
            { label: "dog", correct: false },
            { label: "man", correct: true },
            { label: "child", correct: false },
          ].map((opt) =>
            opt.correct ? (
              <span
                key={opt.label}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[color-mix(in oklch, var(--emerald) 40%, transparent)] text-xs font-semibold text-[var(--emerald)]"
                style={{ backgroundColor: "color-mix(in oklch, var(--emerald) 15%, transparent)" }}
              >
                {opt.label}
                <Check className="h-3 w-3" />
              </span>
            ) : (
              <span
                key={opt.label}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-[var(--surface-2)] text-xs font-semibold text-muted-foreground"
              >
                {opt.label}
              </span>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}

function HeroSection({ onSeeWinners }: { onSeeWinners: () => void }) {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden md:min-h-[80vh]">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ backgroundColor: "color-mix(in oklch, var(--emerald) 15%, transparent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full blur-[100px]"
        style={{ backgroundColor: "color-mix(in oklch, var(--xp) 10%, transparent)" }}
        aria-hidden
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-12 md:py-20">
        <div className="text-center md:text-left">
          <RevealOnScroll delayMs={80}>
            <h1 className="text-[2.25rem] font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-[3.5rem]">
              Africa&apos;s smartest{" "}
              <span className="bg-gradient-to-r from-[var(--emerald)] to-[var(--primary)] bg-clip-text text-transparent">
                puzzle arena.
              </span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delayMs={220}>
            <div
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color-mix(in oklch, var(--coin) 25%, transparent)] px-3.5 py-1.5"
              style={{ backgroundColor: "color-mix(in oklch, var(--coin) 10%, transparent)" }}
            >
              <Trophy className="h-3.5 w-3.5 text-[var(--coin)]" />
              <span className="text-xs font-semibold tabular-nums text-[var(--coin)]">
                Cash prizes drawn every Sunday
              </span>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={280}>
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:justify-start">
              <Link
                href="/renew"
                className="group inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_0_16px_color-mix(in oklch, var(--primary) 40%, transparent)] transition-all hover:bg-primary/90 sm:h-12 sm:w-auto sm:text-sm"
              >
                Start playing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={onSeeWinners}
                className="inline-flex h-12 items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                See past winners
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </RevealOnScroll>
        </div>

        <div className="relative h-[360px] sm:h-[440px] md:h-[460px]">
          <RevealOnScroll delayMs={120} className="absolute inset-0">
            <HeroChessFragment />
          </RevealOnScroll>
          <RevealOnScroll delayMs={240} className="absolute inset-0">
            <HeroProverbCard />
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

// ── Games ─────────────────────────────────────────────────────────────

function GamesShowcase() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RevealOnScroll className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--emerald)]">
            The games
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Two games. One draw. Every Sunday.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            Play chess puzzles and African proverbs. Solve daily to earn draw tickets and compete for
            cash prizes every Sunday.
          </p>
        </RevealOnScroll>

        <div className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-2">
          <RevealOnScroll delayMs={80} className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-border bg-[var(--surface-1)] p-6 shadow-[0_4px_24px_color-mix(in oklch, var(--foreground) 6%, transparent)] transition-all sm:p-7 md:hover:-translate-y-1 md:hover:shadow-[0_0_16px_color-mix(in oklch, var(--primary) 40%, transparent)]">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-xl font-bold">CheckMate</span>
                <span
                  className="rounded-full border border-[color-mix(in oklch, var(--emerald) 20%, transparent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--emerald)]"
                  style={{ backgroundColor: "color-mix(in oklch, var(--emerald) 10%, transparent)" }}
                >
                  Tactical puzzles · daily
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Find the best move in tactical chess puzzles. Forks, pins, skewers and more — one puzzle
                at a time.
              </p>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={160} className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-border bg-[var(--surface-1)] p-6 shadow-[0_4px_24px_color-mix(in oklch, var(--foreground) 6%, transparent)] transition-all sm:p-7 md:hover:-translate-y-1 md:hover:shadow-[0_0_16px_color-mix(in oklch, var(--primary) 40%, transparent)]">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="text-xl font-bold">WisdomDrop</span>
                <span
                  className="rounded-full border border-[color-mix(in oklch, var(--xp) 20%, transparent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--xp)]"
                  style={{ backgroundColor: "color-mix(in oklch, var(--xp) 10%, transparent)" }}
                >
                  5+ African regions
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Fill the blank in proverbs from across Africa. Every right answer earns you a draw ticket.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    icon: Smartphone,
    title: "Subscribe via MTN",
    body: "Join with your MTN number in seconds. No app store. No password.",
  },
  {
    icon: Gamepad2,
    title: "Play daily",
    body: "Solve puzzles to earn draw tickets. The more you play, the more chances you stack.",
  },
  {
    icon: Trophy,
    title: "Win every Sunday",
    body: "Cash and airtime drop to 50+ winners every Sunday. More tickets = better odds.",
  },
] as const;

function HowItWorks() {
  return (
    <section className="relative py-16 sm:py-24 bg-[var(--surface-1)]/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RevealOnScroll className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--emerald)]">
            How it works
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Three steps. Zero friction.</h2>
        </RevealOnScroll>

        <ol className="mt-10 grid gap-5 sm:gap-6 md:grid-cols-3">
          {HOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <RevealOnScroll key={step.title} as="article" delayMs={index * 100} className="h-full">
                <div className="h-full rounded-2xl border border-border bg-[var(--surface-1)] p-6 shadow-[0_4px_24px_color-mix(in oklch, var(--foreground) 6%, transparent)]">
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[color-mix(in oklch, var(--emerald) 30%, transparent)]"
                      style={{ backgroundColor: "color-mix(in oklch, var(--emerald) 10%, transparent)" }}
                    >
                      <Icon className="h-5 w-5 text-[var(--emerald)]" />
                    </div>
                    <span className="text-3xl font-bold tabular-nums leading-none text-[color-mix(in oklch, var(--emerald) 30%, transparent)]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mb-1.5 mt-2 text-lg font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </RevealOnScroll>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ── Winners ───────────────────────────────────────────────────────────

const WINNER_ROWS = [
  { position: 1, phone: "080*****31", entryId: "3F8A2C1D", prize: "₦35,000" },
  { position: 2, phone: "081*****07", entryId: "7B2E9F4A", prize: "₦10,000" },
  { position: 3, phone: "070*****90", entryId: "A1C5D8E2", prize: "₦5,000" },
] as const;

const POSITION_STYLES = [
  { bg: "bg-[oklch(0.75_0.15_85)]/15", text: "text-[oklch(0.75_0.15_85)]", label: "1st" },
  { bg: "bg-[oklch(0.65_0.01_250)]/15", text: "text-[oklch(0.65_0.01_250)]", label: "2nd" },
  { bg: "bg-[oklch(0.55_0.05_55)]/15", text: "text-[oklch(0.55_0.05_55)]", label: "3rd" },
] as const;

function WinnersSection() {
  return (
    <section id="winners" className="relative scroll-mt-16 overflow-hidden py-16 sm:py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ backgroundColor: "color-mix(in oklch, var(--emerald) 10%, transparent)" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <RevealOnScroll className="text-center">
          <div className="mb-3 inline-flex items-center justify-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--emerald)]">
              Recent draw
            </span>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--emerald)] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--emerald)]" />
            </span>
            <span className="text-xs text-muted-foreground">Updated weekly</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Real people. Real wins.</h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            50+ winners every week — cash and airtime
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground/70 tabular-nums">
            Last drawn · Sunday, Apr 20
          </p>
        </RevealOnScroll>

        <RevealOnScroll delayMs={120} className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-border bg-[var(--surface-1)] shadow-[0_4px_24px_color-mix(in oklch, var(--foreground) 6%, transparent)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 bg-[var(--surface-2)]">
              <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                Week of Apr 20 – 26, 2026
              </div>
            </div>

            <div className="divide-y divide-border">
              {WINNER_ROWS.map((row, i) => {
                const style = POSITION_STYLES[row.position - 1];
                return (
                  <div
                    key={row.entryId}
                    className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-2/40 sm:gap-4 sm:px-5"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{row.phone}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        {row.entryId}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      {row.position === 1 ? (
                        <Sparkles className="mb-0.5 inline h-3.5 w-3.5 text-[var(--coin)]" />
                      ) : null}
                      <motion.span
                        className="block text-base font-bold tabular-nums text-[var(--coin)] sm:text-lg"
                        animate={{ opacity: [1, 0.6, 1] }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.5,
                          delay: 0.4 + i * 0.15,
                        }}
                      >
                        {row.prize}
                      </motion.span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-between gap-1.5 border-t border-border px-4 py-3 sm:flex-row sm:px-5 bg-[var(--surface-2)]">
              <span className="text-xs text-muted-foreground">
                + airtime &amp; data winners every week
              </span>
              <Link
                href="/winners"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-[var(--emerald)]"
              >
                See full winners list
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ backgroundColor: "color-mix(in oklch, var(--emerald) 25%, transparent)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
        <RevealOnScroll>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Ready to play?</h2>
        </RevealOnScroll>
        <RevealOnScroll delayMs={80}>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Join thousands of players competing every week.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delayMs={160}>
          <Link
            href="/renew"
            className="group mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_0_16px_color-mix(in oklch, var(--primary) 40%, transparent)] transition-all hover:bg-primary/90 sm:h-12 sm:w-auto sm:text-sm"
          >
            Start playing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </RevealOnScroll>
        <RevealOnScroll delayMs={220}>
          <p className="mt-5 text-xs text-muted-foreground">
            Available on MTN Nigeria. Standard data rates apply.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}

// ── Footer ──────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
        <Link href="/">
          <img src="/winam-logo.png" alt="WinamGames" className="h-7 w-auto" />
        </Link>
        <p className="text-xs tabular-nums text-muted-foreground">
          © {new Date().getFullYear()} WinamGames
        </p>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  useAllowScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToWinners = () => {
    document.getElementById("winners")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="dark min-h-[100dvh] bg-background text-foreground overflow-x-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklch, var(--emerald) 18%, transparent) 0%, transparent 70%), var(--background)",
      }}
    >
      <StickyNav scrolled={scrolled} />
      <HeroSection onSeeWinners={scrollToWinners} />
      <GamesShowcase />
      <HowItWorks />
      <WinnersSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}
