import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Award, ChevronDown, Hash, Gamepad2, Trophy } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { useAllowScroll } from "@/hooks/useAllowScroll";

export const Route = createFileRoute("/_authed/winners")({
  component: WinnersPage,
  head: () => ({
    meta: [
      { title: "Winners — WinamGames" },
      { name: "description", content: "Past weekly draw winners." },
    ],
  }),
});

interface Winner {
  phone: string;
  entryId: string;
  prize: string;
  type: "cash" | "airtime";
}

interface DrawWeek {
  label: string;
  cashWinners: Winner[];
  airtimeTiers: { label: string; winners: Winner[] }[];
  isPlaceholder?: boolean;
}

const DRAW_WEEKS: DrawWeek[] = [
  {
    label: "Apr 7 – 13, 2025",
    cashWinners: [
      { phone: "080*****31", entryId: "#3F8A2C1D", prize: "₦35,000", type: "cash" },
      { phone: "081*****07", entryId: "#7B2E9F4A", prize: "₦10,000", type: "cash" },
      { phone: "070*****90", entryId: "#A1C5D8E2", prize: "₦5,000", type: "cash" },
    ],
    airtimeTiers: [
      {
        label: "₦2,000 Airtime",
        winners: [
          { phone: "090*****42", entryId: "#D4E7F1A3", prize: "₦2,000", type: "airtime" },
          { phone: "081*****91", entryId: "#B8C2D5E9", prize: "₦2,000", type: "airtime" },
          { phone: "080*****56", entryId: "#F3A1B4C7", prize: "₦2,000", type: "airtime" },
          { phone: "070*****14", entryId: "#9E5D2F8A", prize: "₦2,000", type: "airtime" },
          { phone: "091*****03", entryId: "#1C7B3E4D", prize: "₦2,000", type: "airtime" },
        ],
      },
      {
        label: "₦1,000 Airtime",
        winners: [
          { phone: "080*****21", entryId: "#E2F4A6B8", prize: "₦1,000", type: "airtime" },
          { phone: "081*****34", entryId: "#4D6E8F1A", prize: "₦1,000", type: "airtime" },
          { phone: "090*****47", entryId: "#7A3C5E9B", prize: "₦1,000", type: "airtime" },
          { phone: "070*****90", entryId: "#C8D1E3F5", prize: "₦1,000", type: "airtime" },
          { phone: "091*****03", entryId: "#2B4D6F8A", prize: "₦1,000", type: "airtime" },
          { phone: "080*****58", entryId: "#F1A3C5E7", prize: "₦1,000", type: "airtime" },
          { phone: "081*****72", entryId: "#8B2D4F6A", prize: "₦1,000", type: "airtime" },
          { phone: "070*****85", entryId: "#3E5A7C9D", prize: "₦1,000", type: "airtime" },
          { phone: "090*****16", entryId: "#D7F1A3B5", prize: "₦1,000", type: "airtime" },
          { phone: "080*****49", entryId: "#5C8E1A3D", prize: "₦1,000", type: "airtime" },
        ],
      },
      {
        label: "₦500 Data",
        winners: Array.from({ length: 60 }, (_, i) => {
          const prefixes = ["080", "081", "070", "090", "091"];
          const prefix = prefixes[i % prefixes.length];
          const last2 = String((i * 13 + 7) % 100).padStart(2, "0");
          return {
            phone: `${prefix}*****${last2}`,
            entryId: `#${((i * 2654435761) >>> 0).toString(16).toUpperCase().padStart(8, "0")}`,
            prize: "₦500",
            type: "airtime" as const,
          };
        }),
      },
    ],
  },
  {
    label: "Mar 31 – Apr 6, 2025",
    cashWinners: [
      { phone: "081*****14", entryId: "#2A4C6E8F", prize: "₦35,000", type: "cash" },
      { phone: "090*****87", entryId: "#B1D3F5A7", prize: "₦10,000", type: "cash" },
      { phone: "070*****41", entryId: "#8E1A3C5D", prize: "₦5,000", type: "cash" },
    ],
    airtimeTiers: [
      {
        label: "₦2,000 Airtime",
        winners: [
          { phone: "080*****28", entryId: "#C7E9F1A3", prize: "₦2,000", type: "airtime" },
          { phone: "091*****53", entryId: "#5A3D1E8B", prize: "₦2,000", type: "airtime" },
          { phone: "070*****96", entryId: "#D2F4B6C8", prize: "₦2,000", type: "airtime" },
          { phone: "081*****71", entryId: "#A1E3C5D7", prize: "₦2,000", type: "airtime" },
          { phone: "090*****05", entryId: "#6B8D2F4A", prize: "₦2,000", type: "airtime" },
        ],
      },
      {
        label: "₦1,000 Airtime",
        winners: [
          { phone: "080*****34", entryId: "#F5A7C9E1", prize: "₦1,000", type: "airtime" },
          { phone: "091*****07", entryId: "#3D5F8A2B", prize: "₦1,000", type: "airtime" },
          { phone: "070*****40", entryId: "#B4D6E8F1", prize: "₦1,000", type: "airtime" },
          { phone: "081*****73", entryId: "#7C1A3E5D", prize: "₦1,000", type: "airtime" },
          { phone: "090*****06", entryId: "#E9F1A3C5", prize: "₦1,000", type: "airtime" },
          { phone: "080*****39", entryId: "#2D4F6B8A", prize: "₦1,000", type: "airtime" },
          { phone: "070*****62", entryId: "#A5C7E9F1", prize: "₦1,000", type: "airtime" },
          { phone: "081*****95", entryId: "#8B1D3F5A", prize: "₦1,000", type: "airtime" },
          { phone: "090*****28", entryId: "#D6E8F1A3", prize: "₦1,000", type: "airtime" },
          { phone: "080*****51", entryId: "#4A6C8E2D", prize: "₦1,000", type: "airtime" },
        ],
      },
      {
        label: "₦500 Data",
        winners: Array.from({ length: 60 }, (_, i) => {
          const prefixes = ["080", "081", "070", "090", "091"];
          const prefix = prefixes[(i + 2) % prefixes.length];
          const last2 = String((i * 17 + 3) % 100).padStart(2, "0");
          return {
            phone: `${prefix}*****${last2}`,
            entryId: `#${((i * 1597334677) >>> 0).toString(16).toUpperCase().padStart(8, "0")}`,
            prize: "₦500",
            type: "airtime" as const,
          };
        }),
      },
    ],
  },
];

const POSITION_STYLES = [
  { bg: "bg-[oklch(0.75_0.15_85)]/15", text: "text-[oklch(0.75_0.15_85)]", label: "1st" },
  { bg: "bg-[oklch(0.65_0.01_250)]/15", text: "text-[oklch(0.65_0.01_250)]", label: "2nd" },
  { bg: "bg-[oklch(0.55_0.05_55)]/15", text: "text-[oklch(0.55_0.05_55)]", label: "3rd" },
];

function DrawWeekCard({ draw, defaultOpen }: { draw: DrawWeek; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const totalAirtimeWinners = draw.airtimeTiers.reduce((s, t) => s + t.winners.length, 0);
  const totalWinners = draw.cashWinners.length + totalAirtimeWinners;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-2xl bg-surface-1 border border-border overflow-hidden">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 hover:bg-surface-1/80 transition-colors">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold">{draw.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {draw.isPlaceholder ? "50+ winners" : `${totalWinners} winners`}
              </p>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* Cash winners */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60">
                Cash Prizes
              </p>
              {draw.cashWinners.map((w, j) => (
                <div key={j} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-7 w-7 rounded-full ${POSITION_STYLES[j].bg} flex items-center justify-center text-[10px] font-bold ${POSITION_STYLES[j].text}`}
                    >
                      {POSITION_STYLES[j].label}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium tabular-nums">{w.phone}</span>
                      <span className="text-[9px] text-muted-foreground tabular-nums flex items-center gap-0.5">
                        <Hash className="h-2 w-2" />
                        {w.entryId.slice(1)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">{w.prize}</span>
                </div>
              ))}
            </div>

            {/* Airtime & data summary */}
            <p className="text-xs text-muted-foreground px-1">
              + {totalAirtimeWinners} airtime & data winners
            </p>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function WinnersPage() {
  useAllowScroll();
  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <TopBar backTo="/" />
      <div className="px-4 pb-6 space-y-4">
        {/* Hero / Ad Card */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 text-center space-y-2">
          <Award className="h-8 w-8 text-primary mx-auto" />
          <h1 className="text-xl font-bold">Real people. Real wins.</h1>
          <p className="text-xs text-muted-foreground">
            50+ winners every week — cash, airtime & data
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Gamepad2 className="h-4 w-4" />
            Play Now
          </Link>
        </div>

        {/* Draw weeks */}
        <div className="space-y-3">
          {DRAW_WEEKS.map((draw, i) => (
            <DrawWeekCard key={i} draw={draw} defaultOpen={i === 0} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl bg-surface-1 border border-border p-4 text-center space-y-2">
          <p className="text-sm font-semibold">Keep playing, keep winning</p>
          <p className="text-[11px] text-muted-foreground">
            More entries = better odds. Play daily to climb the ranks.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            Back to Games
          </Link>
        </div>
      </div>
    </div>
  );
}
