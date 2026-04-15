import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/layout/BottomNav";
import { Swords } from "lucide-react";

export const Route = createFileRoute("/checkmate")({
  component: CheckMatePage,
  head: () => ({
    meta: [
      { title: "CheckMate — WinamGames" },
      { name: "description", content: "Solve chess puzzles and earn draw entries." },
    ],
  }),
});

function CheckMatePage() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <div className="px-4 pt-6 pb-24 flex flex-col items-center justify-center min-h-screen">
        <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
          <Swords className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold">CheckMate</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-[260px]">
          Chess puzzles coming in Phase 2
        </p>
        <button className="mt-6 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-glow">
          Start Game
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
