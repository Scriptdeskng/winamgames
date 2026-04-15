import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/layout/BottomNav";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/wisdomdrop")({
  component: WisdomDropPage,
  head: () => ({
    meta: [
      { title: "WisdomDrop — WinamGames" },
      { name: "description", content: "Complete African proverbs and earn draw entries." },
    ],
  }),
});

function WisdomDropPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <div className="px-4 pt-6 pb-24 flex flex-col items-center justify-center min-h-screen">
        <div className="h-16 w-16 rounded-2xl bg-xp/15 flex items-center justify-center mb-4">
          <BookOpen className="h-8 w-8 text-xp" />
        </div>
        <h1 className="text-xl font-bold">WisdomDrop</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-[260px]">
          African proverb puzzles coming in Phase 2
        </p>
        <button className="mt-6 h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-glow">
          Start Game
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
