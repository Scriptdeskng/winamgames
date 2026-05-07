export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const winners = [
  { phone: "080*****31", prize: "₦35,000" },
  { phone: "081*****07", prize: "₦10,000" },
  { phone: "070*****90", prize: "₦5,000" },
];

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" aria-label="WinamGames home" className="flex items-center">
            <img src="/winam-logo.png" alt="WinamGames" className="h-7 w-auto" />
          </a>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 hover:bg-primary/90 transition-colors shadow-glow"
          >
            Play now
            <span aria-hidden className="text-sm leading-none">→</span>
          </a>
        </div>
      </header>

      <section className="relative min-h-[100dvh] md:min-h-[80vh] flex items-center overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-emerald/15 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-xp/10 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-20 grid md:grid-cols-2 gap-10 md:gap-12 items-center w-full">
          <div className="text-center md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald mb-3">WinamGames</p>
            <h1 className="text-[2.25rem] sm:text-5xl md:text-[3.5rem] font-bold leading-[1.05] tracking-tight">
              Africa&apos;s smartest <span className="text-gradient-emerald">puzzle arena.</span>
            </h1>

            <p className="mt-4 max-w-xl text-sm sm:text-base text-muted-foreground mx-auto md:mx-0">
              Solve chess tactics and African proverb puzzles, earn tickets, and join the weekly Sunday cash draw.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:justify-start justify-center">
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 h-14 sm:h-12 w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-semibold text-base sm:text-sm px-6 hover:bg-primary/90 transition-all shadow-glow"
              >
                Play now
                <span aria-hidden className="text-sm leading-none">→</span>
              </a>
              <a href="#winners" className="text-sm text-muted-foreground hover:text-foreground transition-colors h-12 inline-flex items-center justify-center gap-1">
                See past winners
                <span aria-hidden className="text-sm leading-none">⌄</span>
              </a>
            </div>
          </div>

          <div className="relative h-[360px] sm:h-[440px] md:h-[460px]">
            <div className="absolute left-0 top-2 sm:top-4 w-[68%] sm:w-[60%] max-w-[300px] rotate-[-6deg]">
              <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald">CheckMate</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">Mate in 1</span>
                </div>
                <div className="grid grid-cols-4 gap-0 rounded-lg overflow-hidden border border-border">
                  {[
                    { light: true }, { light: false }, { light: true, piece: "♚" }, { light: false },
                    { light: false }, { light: true }, { light: false }, { light: true },
                    { light: true }, { light: false, piece: "♕", highlight: true }, { light: true }, { light: false },
                    { light: false }, { light: true }, { light: false, piece: "♔" }, { light: true },
                  ].map((cell, index) => (
                    <div
                      key={index}
                      className={`relative aspect-square flex items-center justify-center text-2xl sm:text-3xl select-none ${cell.light ? "bg-surface-3" : "bg-surface-2"} ${
                        cell.highlight ? "ring-2 ring-emerald ring-inset" : ""
                      }`}
                    >
                      {cell.piece && <span className="relative text-foreground">{cell.piece}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 sm:bottom-2 w-[78%] sm:w-[64%] max-w-[320px] rotate-[4deg]">
              <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-xp">WisdomDrop</span>
                  <span className="text-[10px] text-muted-foreground">Yoruba</span>
                </div>
                <p className="text-sm sm:text-[15px] font-medium text-foreground leading-relaxed mb-3.5">
                  &quot;A patient <span className="inline-block min-w-[44px] text-center px-2 py-0.5 rounded-md border border-dashed border-emerald/50 text-emerald text-xs font-semibold tracking-wider align-middle">___</span> eats ripe fruit.&quot;
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["lion", "dog", "man", "child"].map((label) => (
                    <div
                      key={label}
                      className="relative h-9 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 bg-surface-2 border-border text-muted-foreground"
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald mb-3">The games</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Two games. One draw. Every Sunday.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-6 sm:p-7">
              <h3 className="text-xl font-bold mb-3">CheckMate</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Tactical chess puzzles. Solve the move, win tickets, and push your streak higher.
              </p>
            </div>
            <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-6 sm:p-7">
              <h3 className="text-xl font-bold mb-3">WisdomDrop</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Fill the blank in African proverbs to earn tickets and climb the weekly draw.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 sm:py-24 bg-surface-1/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Three steps. Zero friction.</h2>
          </div>

          <ol className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {[
              { step: "01", title: "Subscribe via MTN", body: "Join with your MTN number in seconds." },
              { step: "02", title: "Play daily", body: "Solve puzzles to earn weekly draw tickets." },
              { step: "03", title: "Win every Sunday", body: "Cash prizes are drawn weekly from active tickets." },
            ].map((item) => (
              <li key={item.title} className="rounded-2xl bg-surface-1 border border-border p-6 shadow-card list-none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative h-11 w-11 rounded-full bg-emerald/10 border border-emerald/30 flex items-center justify-center">
                    <span className="text-emerald font-semibold">{item.step}</span>
                  </div>
                  <span className="text-3xl font-bold tabular-nums text-emerald/30 leading-none">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="winners" className="relative py-16 sm:py-24 scroll-mt-16 overflow-hidden">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald mb-3">Recent draw</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Real people. Real wins.</h2>
          </div>

          <div className="relative rounded-2xl bg-surface-1 border border-border overflow-hidden shadow-card">
            <div className="divide-y divide-border">
              {winners.map((winner, index) => (
                <div key={winner.phone} className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-surface-2/40">
                  <div className="shrink-0 h-9 w-9 rounded-full bg-emerald/15 text-emerald flex items-center justify-center text-xs font-bold tabular-nums">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold tabular-nums text-foreground">{winner.phone}</p>
                  </div>
                  <p className="text-base sm:text-lg font-bold tabular-nums text-coin">{winner.prize}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 border-y border-border bg-surface-1/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-wrap justify-center gap-2.5">
          {[
            "500+ players this week",
            "50+ winners Sunday",
            "₦50,000 prizes weekly",
            "2 games · infinite fun",
          ].map((fact) => (
            <div key={fact} className="inline-flex items-center gap-2 rounded-full bg-surface-2 border border-border px-4 py-2 text-sm text-foreground/90">
              <span className="h-2 w-2 rounded-full bg-emerald" />
              <span className="whitespace-nowrap">{fact}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
