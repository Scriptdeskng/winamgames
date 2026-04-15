import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/layout/BottomNav";
import { Ticket, ArrowLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/entries")({
  component: EntriesPage,
  head: () => ({
    meta: [
      { title: "My Entries — WinamGames" },
      { name: "description", content: "View your weekly draw entries." },
    ],
  }),
});

function EntriesPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <div className="px-4 pt-6 pb-24 space-y-5">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">My Entries</h1>
          </div>
        </div>

        {/* Current Week */}
        <div className="rounded-2xl bg-glass border border-glass-border p-4 shadow-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">This Week</p>
          <p className="text-4xl font-bold tabular-nums text-primary mt-1">12 / 50</p>
          <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "24%" }} />
          </div>
        </div>

        {/* History */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Past Weeks</h2>
          <div className="space-y-2">
            {[
              { week: "Mar 31 – Apr 6", entries: 42, result: "No win" },
              { week: "Mar 24 – Mar 30", entries: 50, result: "Won ₦5,000!" },
              { week: "Mar 17 – Mar 23", entries: 38, result: "No win" },
            ].map((w, i) => (
              <div key={i} className="rounded-xl bg-surface-1 border border-glass-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{w.week}</p>
                  <p className="text-xs text-muted-foreground">{w.entries} entries</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-medium ${w.result.includes("Won") ? "text-primary" : "text-muted-foreground"}`}>
                    {w.result}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
