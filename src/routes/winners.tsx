import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/layout/BottomNav";
import { Award, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/winners")({
  component: WinnersPage,
  head: () => ({
    meta: [
      { title: "Winners — WinamGames" },
      { name: "description", content: "Past weekly draw winners." },
    ],
  }),
});

function WinnersPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <div className="px-4 pt-6 pb-24 space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-gold" />
            <h1 className="text-xl font-bold">Winners</h1>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { week: "Week of Apr 7", winners: [{ name: "ProverbMaster", prize: "₦50,000" }, { name: "ChessKing", prize: "₦20,000" }] },
            { week: "Week of Mar 31", winners: [{ name: "NaijaWiz", prize: "₦50,000" }, { name: "PuzzlePro", prize: "₦20,000" }] },
          ].map((draw, i) => (
            <div key={i} className="rounded-2xl bg-surface-1 border border-glass-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">{draw.week}</p>
              <div className="space-y-2">
                {draw.winners.map((w, j) => (
                  <div key={j} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gold/15 flex items-center justify-center text-xs font-bold text-gold">
                        {j + 1}
                      </div>
                      <span className="text-sm font-medium">{w.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">{w.prize}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
