import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Trophy, Coins, Users, Sparkles, Smartphone, Gamepad2,
  ArrowRight, Hash, Calendar, Check, ChevronDown,
} from "lucide-react";
import logo from "@/assets/winam-logo.png";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "WinAm Games — Africa's smartest puzzle arena" },
      {
        name: "description",
        content:
          "Play CheckMate and WisdomDrop. Sharpen your mind on chess tactics and African proverbs. Win cash every Sunday. Available on MTN Nigeria.",
      },
      {
        property: "og:title",
        content: "WinAm Games — Africa's smartest puzzle arena",
      },
      {
        property: "og:description",
        content:
          "Endless wisdom. Sharper play. Every Sunday someone wins. Join the daily puzzle arena built for Nigeria.",
      },
      {
        property: "og:image",
        content: "https://winamgames.lovable.app/winam-logo.png",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "WinAm Games — Africa's smartest puzzle arena",
      },
      {
        name: "twitter:description",
        content:
          "Sharpen your mind on chess and African proverbs. Win cash every Sunday.",
      },
      {
        name: "twitter:image",
        content: "https://winamgames.lovable.app/winam-logo.png",
      },
    ],
  }),
});

// ── Landing Page ─────────────────────────────────────────────────────
function LandingPage() {
  useAllowScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToWinners = () => {
    const el = document.getElementById("winners");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      <StickyNav scrolled={scrolled} />
      <HeroSection onSeeWinners={scrollToWinners} />
      <GamesShowcase />
      <HowItWorks />
      <WinnersSection />
      <SocialProofStrip />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// ── Sticky Nav ───────────────────────────────────────────────────────
function StickyNav({ scrolled }: { scrolled: boolean }) {
  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/75 backdrop-blur-md border-b border-border"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" aria-label="WinAm Games home" className="flex items-center">
          <img src={logo} alt="WinAm" className="h-7 w-auto" />
        </Link>
        <Link
          to="/subscribe"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 hover:bg-primary/90 transition-colors shadow-glow"
        >
          Play now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────
function HeroSection({ onSeeWinners }: { onSeeWinners: () => void }) {
  return (
    <section className="relative min-h-[100dvh] md:min-h-[80vh] flex items-center overflow-hidden">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-emerald/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-xp/10 blur-[100px]"
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20 grid md:grid-cols-2 gap-10 md:gap-12 items-center w-full">
        {/* Copy */}
        <div className="text-center md:text-left">
          <RevealOnScroll>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <Sparkles className="h-3 w-3 text-emerald" />
              Daily puzzle arena
            </span>
          </RevealOnScroll>

          <RevealOnScroll delayMs={80}>
            <h1 className="mt-4 text-[2.25rem] sm:text-5xl md:text-[3.5rem] font-bold leading-[1.05] tracking-tight">
              Africa's smartest <span className="text-gradient-emerald">puzzle arena.</span>
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delayMs={220}>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-coin/10 border border-coin/25 px-3.5 py-1.5">
              <Trophy className="h-3.5 w-3.5 text-coin" />
              <span className="text-xs font-semibold text-coin tabular-nums">
                Cash prizes drawn every Sunday
              </span>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delayMs={280}>
            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:justify-start justify-center">
              <Link
                to="/subscribe"
                className="group inline-flex items-center justify-center gap-2 h-14 sm:h-12 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-semibold text-base sm:text-sm px-6 hover:bg-primary/90 transition-all shadow-glow"
              >
                Start playing
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                onClick={onSeeWinners}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors h-12 inline-flex items-center justify-center gap-1"
              >
                See past winners
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </RevealOnScroll>
        </div>

        {/* Visual */}
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

// 4×4 chess board fragment with white queen threatening mate
function HeroChessFragment() {
  // Position is a stylized fragment, not a literal board square mapping.
  // White queen (♕) on the highlighted square threatens the black king (♚).
  const cells: { piece?: string; light: boolean; highlight?: "from" | "to" }[] = [
    { light: true }, { light: false }, { light: true, piece: "♚" }, { light: false },
    { light: false }, { light: true }, { light: false }, { light: true },
    { light: true }, { light: false, piece: "♕", highlight: "to" }, { light: true }, { light: false },
    { light: false }, { light: true }, { light: false, piece: "♔" }, { light: true },
  ];

  return (
    <div className="absolute left-0 top-2 sm:top-4 w-[68%] sm:w-[60%] max-w-[300px] rotate-[-6deg]">
      <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-3 animate-landing-float">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald">
            CheckMate
          </span>
          <span className="text-[10px] text-muted-foreground tabular-nums">
            Mate in 1
          </span>
        </div>
        <div className="grid grid-cols-4 gap-0 rounded-lg overflow-hidden border border-border">
          {cells.map((c, i) => (
            <div
              key={i}
              className={`relative aspect-square flex items-center justify-center text-2xl sm:text-3xl select-none ${
                c.light
                  ? "bg-surface-3"
                  : "bg-surface-2"
              } ${c.highlight === "to" ? "ring-2 ring-emerald ring-inset" : ""}`}
            >
              {c.highlight === "to" && (
                <span
                  aria-hidden
                  className="absolute inset-1 rounded-md animate-landing-pulse-ring"
                />
              )}
              {c.piece && (
                <span
                  className={`relative ${
                    c.piece === "♕" || c.piece === "♔" ? "text-foreground animate-landing-piece-glow" : "text-foreground/85"
                  }`}
                  style={{ textShadow: "0 1px 1px rgba(0,0,0,0.5)" }}
                >
                  {c.piece}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Proverb fill-in card overlapping the chess fragment
function HeroProverbCard() {
  return (
    <div className="absolute right-0 bottom-0 sm:bottom-2 w-[78%] sm:w-[64%] max-w-[320px] rotate-[4deg]">
      <div
        className="rounded-2xl bg-surface-1 border border-border shadow-card p-4 animate-landing-float"
        style={{ animationDelay: "-1.8s" }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-xp">
            WisdomDrop
          </span>
          <span className="text-[10px] text-muted-foreground">Yoruba</span>
        </div>
        <p className="text-sm sm:text-[15px] font-medium text-foreground leading-relaxed mb-3.5">
          "A patient{" "}
          <span className="inline-block min-w-[44px] text-center px-2 py-0.5 rounded-md border border-dashed border-emerald/50 text-emerald text-xs font-semibold tracking-wider align-middle">
            ___
          </span>{" "}
          eats ripe fruit."
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "lion", correct: false },
            { label: "dog", correct: false },
            { label: "man", correct: true },
            { label: "child", correct: false },
          ].map((opt) => (
            <div
              key={opt.label}
              className={`relative h-9 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 ${
                opt.correct
                  ? "bg-emerald/15 border-emerald/40 text-emerald animate-landing-pulse-ring"
                  : "bg-surface-2 border-border text-muted-foreground"
              }`}
            >
              {opt.correct && <Check className="h-3 w-3" />}
              {opt.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Games Showcase ───────────────────────────────────────────────────
function GamesShowcase() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RevealOnScroll>
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald mb-3">
              The games
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Built for the way you think.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Tactical chess puzzles and proverbs from across the continent. Both bite-sized. Both daily.
            </p>
          </div>
        </RevealOnScroll>

        <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
          <RevealOnScroll delayMs={80}>
            <CheckMatePreviewCard />
          </RevealOnScroll>
          <RevealOnScroll delayMs={160}>
            <WisdomDropPreviewCard />
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

function CheckMatePreviewCard() {
  return (
    <div className="group h-full rounded-2xl bg-surface-1 border border-border shadow-card p-6 sm:p-7 transition-all md:hover:-translate-y-1 md:hover:shadow-glow flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">CheckMate</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald bg-emerald/10 border border-emerald/20 rounded-full px-2.5 py-1">
          1-move mates · daily
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        One move. One mate. Train your tactical eye with bite-sized puzzles you can finish on the way to work.
      </p>
    </div>
  );
}

function WisdomDropPreviewCard() {
  return (
    <div className="group h-full rounded-2xl bg-surface-1 border border-border shadow-card p-6 sm:p-7 transition-all md:hover:-translate-y-1 md:hover:shadow-glow flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">WisdomDrop</h3>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-xp bg-xp/10 border border-xp/20 rounded-full px-2.5 py-1">
          Yoruba · Hausa · Igbo · Akan +
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Fill the blank in proverbs from across Africa. Every right answer earns you a draw ticket.
      </p>
    </div>
  );
}

// ── How It Works ─────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
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
  ];

  return (
    <section className="relative py-16 sm:py-24 bg-surface-1/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RevealOnScroll>
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald mb-3">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Three steps. Zero friction.
            </h2>
          </div>
        </RevealOnScroll>

        <ol className="grid md:grid-cols-3 gap-5 sm:gap-6 relative">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <RevealOnScroll key={s.title} delayMs={i * 100} as="article">
                <div className="relative h-full rounded-2xl bg-surface-1 border border-border p-6 shadow-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative h-11 w-11 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-emerald" />
                    </div>
                    <span className="text-3xl font-bold tabular-nums text-emerald/30 leading-none">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </RevealOnScroll>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

// ── Winners Section ──────────────────────────────────────────────────
const POSITION_STYLES = [
  { bg: "bg-[oklch(0.75_0.15_85)]/15", text: "text-[oklch(0.75_0.15_85)]", label: "1st" },
  { bg: "bg-[oklch(0.65_0.01_250)]/15", text: "text-[oklch(0.65_0.01_250)]", label: "2nd" },
  { bg: "bg-[oklch(0.55_0.05_55)]/15", text: "text-[oklch(0.55_0.05_55)]", label: "3rd" },
];

function WinnersSection() {
  const cashWinners = [
    { phone: "080*****31", entryId: "#3F8A2C1D", prize: "₦35,000" },
    { phone: "081*****07", entryId: "#7B2E9F4A", prize: "₦10,000" },
    { phone: "070*****90", entryId: "#A1C5D8E2", prize: "₦5,000" },
  ];

  return (
    <section id="winners" className="relative py-16 sm:py-24 scroll-mt-16 overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full bg-emerald/10 blur-[120px]"
      />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <RevealOnScroll>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
                Recent draw
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
                </span>
                Updated weekly
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Real people. Real wins.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              50+ winners every week — cash and airtime
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground/70 tabular-nums">
              Last drawn · Sunday, Apr 13
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delayMs={120}>
          <div className="relative rounded-2xl bg-surface-1 border border-border overflow-hidden shadow-card">
            <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2 border-b border-border bg-surface-1/60">
              <div className="inline-flex items-center gap-2 min-w-0">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground tabular-nums truncate">
                  Week of Apr 7 – 13, 2025
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 border border-emerald/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
                </span>
                Live
              </span>
            </div>

            <div className="divide-y divide-border">
              {cashWinners.map((w, i) => {
                const pos = POSITION_STYLES[i];
                return (
                  <RevealOnScroll key={w.entryId} delayMs={i * 120}>
                    <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 transition-colors hover:bg-surface-2/40">
                      <div
                        className={`shrink-0 h-9 w-9 rounded-full ${pos.bg} ${pos.text} flex items-center justify-center text-xs font-bold tabular-nums`}
                      >
                        {pos.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {w.phone}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
                          <Hash className="h-3 w-3" />
                          {w.entryId.replace(/^#/, "")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right inline-flex items-center gap-1.5">
                        {i === 0 && <Sparkles className="h-3.5 w-3.5 text-coin" />}
                        <p
                          className="text-base sm:text-lg font-bold tabular-nums text-coin animate-landing-shimmer"
                          style={{ animationDelay: `${0.4 + i * 0.15}s` }}
                        >
                          {w.prize}
                        </p>
                      </div>
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>

            <div className="px-4 sm:px-5 py-3 border-t border-border bg-surface-1/60 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
              <span className="text-xs text-muted-foreground">
                + airtime &amp; data winners every week
              </span>
              <Link
                to="/subscribe"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald transition-colors"
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

// ── Social Proof Strip ───────────────────────────────────────────────
function SocialProofStrip() {
  const facts = [
    { icon: Users, label: "500+ players this week" },
    { icon: Trophy, label: "50+ winners every Sunday" },
    { icon: Coins, label: "Real cash, every week" },
    { icon: Sparkles, label: "Infinite challenge" },
  ];

  return (
    <section className="py-10 sm:py-14 border-y border-border bg-surface-1/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex md:flex-wrap md:justify-center gap-2.5 overflow-x-auto snap-x snap-mandatory md:overflow-visible -mx-4 sm:-mx-6 px-4 sm:px-6 md:mx-0 md:px-0">
          {facts.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="snap-start shrink-0 inline-flex items-center gap-2 rounded-full bg-surface-2 border border-border px-4 py-2 text-sm text-foreground/90"
              >
                <Icon className="h-4 w-4 text-emerald shrink-0" />
                <span className="whitespace-nowrap">{f.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-emerald/15 blur-[120px]"
      />
      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 text-center">
        <RevealOnScroll>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Ready to play?
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delayMs={80}>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground">
            Join thousands of players competing every week.
          </p>
        </RevealOnScroll>
        <RevealOnScroll delayMs={160}>
          <Link
            to="/subscribe"
            className="group mt-8 inline-flex items-center justify-center gap-2 h-14 sm:h-12 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-semibold text-base sm:text-sm px-8 hover:bg-primary/90 transition-all shadow-glow"
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

// ── Footer ───────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link to="/" aria-label="WinAm Games home" className="flex items-center">
          <img src={logo} alt="WinAm" className="h-6 w-auto" />
        </Link>
        <p className="text-xs text-muted-foreground tabular-nums">
          © {new Date().getFullYear()} WinAm Games
        </p>
      </div>
    </footer>
  );
}
