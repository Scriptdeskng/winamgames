import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Award, ChevronDown, Phone, Hash } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

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
}

const DRAW_WEEKS: DrawWeek[] = [
  {
    label: "Apr 7 – 13, 2025",
    cashWinners: [
      { phone: "***8231", entryId: "#3F8A2C1D", prize: "₦35,000", type: "cash" },
      { phone: "***4507", entryId: "#7B2E9F4A", prize: "₦10,000", type: "cash" },
      { phone: "***1190", entryId: "#A1C5D8E2", prize: "₦5,000", type: "cash" },
    ],
    airtimeTiers: [
      {
        label: "₦2,000 Airtime",
        winners: [
          { phone: "***3342", entryId: "#D4E7F1A3", prize: "₦2,000", type: "airtime" },
          { phone: "***7891", entryId: "#B8C2D5E9", prize: "₦2,000", type: "airtime" },
          { phone: "***2056", entryId: "#F3A1B4C7", prize: "₦2,000", type: "airtime" },
          { phone: "***6614", entryId: "#9E5D2F8A", prize: "₦2,000", type: "airtime" },
          { phone: "***9103", entryId: "#1C7B3E4D", prize: "₦2,000", type: "airtime" },
        ],
      },
      {
        label: "₦1,000 Airtime",
        winners: [
          { phone: "***5521", entryId: "#E2F4A6B8", prize: "₦1,000", type: "airtime" },
          { phone: "***8834", entryId: "#4D6E8F1A", prize: "₦1,000", type: "airtime" },
          { phone: "***1247", entryId: "#7A3C5E9B", prize: "₦1,000", type: "airtime" },
          { phone: "***3690", entryId: "#C8D1E3F5", prize: "₦1,000", type: "airtime" },
          { phone: "***7403", entryId: "#2B4D6F8A", prize: "₦1,000", type: "airtime" },
          { phone: "***0158", entryId: "#F1A3C5E7", prize: "₦1,000", type: "airtime" },
          { phone: "***4972", entryId: "#8B2D4F6A", prize: "₦1,000", type: "airtime" },
          { phone: "***6385", entryId: "#3E5A7C9D", prize: "₦1,000", type: "airtime" },
          { phone: "***2716", entryId: "#D7F1A3B5", prize: "₦1,000", type: "airtime" },
          { phone: "***8049", entryId: "#5C8E1A3D", prize: "₦1,000", type: "airtime" },
        ],
      },
      {
        label: "₦500 Data",
        winners: Array.from({ length: 60 }, (_, i) => ({
          phone: `***${String(1000 + i * 13 + 7).slice(-4)}`,
          entryId: `#${((i * 2654435761) >>> 0).toString(16).toUpperCase().padStart(8, "0")}`,
          prize: "₦500",
          type: "airtime" as const,
        })),
      },
    ],
  },
  {
    label: "Mar 31 – Apr 6, 2025",
    cashWinners: [
      { phone: "***5614", entryId: "#2A4C6E8F", prize: "₦35,000", type: "cash" },
      { phone: "***9387", entryId: "#B1D3F5A7", prize: "₦10,000", type: "cash" },
      { phone: "***2741", entryId: "#8E1A3C5D", prize: "₦5,000", type: "cash" },
    ],
    airtimeTiers: [
      {
        label: "₦2,000 Airtime",
        winners: [
          { phone: "***4128", entryId: "#C7E9F1A3", prize: "₦2,000", type: "airtime" },
          { phone: "***7653", entryId: "#5A3D1E8B", prize: "₦2,000", type: "airtime" },
          { phone: "***0296", entryId: "#D2F4B6C8", prize: "₦2,000", type: "airtime" },
          { phone: "***8471", entryId: "#A1E3C5D7", prize: "₦2,000", type: "airtime" },
          { phone: "***3905", entryId: "#6B8D2F4A", prize: "₦2,000", type: "airtime" },
        ],
      },
      {
        label: "₦1,000 Airtime",
        winners: [
          { phone: "***1834", entryId: "#F5A7C9E1", prize: "₦1,000", type: "airtime" },
          { phone: "***6207", entryId: "#3D5F8A2B", prize: "₦1,000", type: "airtime" },
          { phone: "***9540", entryId: "#B4D6E8F1", prize: "₦1,000", type: "airtime" },
          { phone: "***2873", entryId: "#7C1A3E5D", prize: "₦1,000", type: "airtime" },
          { phone: "***5106", entryId: "#E9F1A3C5", prize: "₦1,000", type: "airtime" },
          { phone: "***8439", entryId: "#2D4F6B8A", prize: "₦1,000", type: "airtime" },
          { phone: "***0762", entryId: "#A5C7E9F1", prize: "₦1,000", type: "airtime" },
          { phone: "***4095", entryId: "#8B1D3F5A", prize: "₦1,000", type: "airtime" },
          { phone: "***7328", entryId: "#D6E8F1A3", prize: "₦1,000", type: "airtime" },
          { phone: "***1651", entryId: "#4A6C8E2D", prize: "₦1,000", type: "airtime" },
        ],
      },
      {
        label: "₦500 Data",
        winners: Array.from({ length: 60 }, (_, i) => ({
          phone: `***${String(2000 + i * 17 + 3).slice(-4)}`,
          entryId: `#${((i * 1597334677) >>> 0).toString(16).toUpperCase().padStart(8, "0")}`,
          prize: "₦500",
          type: "airtime" as const,
        })),
      },
    ],
  },
];

const POSITION_STYLES = [
  { bg: "bg-[oklch(0.75_0.15_85)]/15", text: "text-[oklch(0.75_0.15_85)]", label: "1st" },
  { bg: "bg-[oklch(0.65_0.01_250)]/15", text: "text-[oklch(0.65_0.01_250)]", label: "2nd" },
  { bg: "bg-[oklch(0.55_0.05_55)]/15", text: "text-[oklch(0.55_0.05_55)]", label: "3rd" },
];

function AirtimeSection({ tiers }: { tiers: DrawWeek["airtimeTiers"] }) {
  const [open, setOpen] = useState(false);
  const totalAirtimeWinners = tiers.reduce((s, t) => s + t.winners.length, 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl bg-surface-1 border border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-surface-1/80 transition-colors">
        <span>Airtime & Data — {totalAirtimeWinners} winners</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {tiers.map((tier) => (
          <div key={tier.label} className="rounded-xl bg-surface-1 border border-border p-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              {tier.label} ({tier.winners.length})
            </p>
            <div className="space-y-1">
              {tier.winners.map((w, j) => (
                <div
                  key={j}
                  className="flex items-center justify-between py-1 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium tabular-nums">{w.phone}</span>
                    <span className="text-muted-foreground tabular-nums">{w.entryId}</span>
                  </div>
                  <span className="font-semibold text-primary">{w.prize}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function WinnersPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <TopBar backTo="/" />
      <div className="px-4 pb-6 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold">Past Winners</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Every week, 78 players win real cash, airtime & data.
          </p>
        </div>

        {/* Prize breakdown */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
          <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">
            Weekly Prize Pool — ₦100,000
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>🥇 1st Place</span><span className="text-right font-medium text-foreground">₦35,000</span>
            <span>🥈 2nd Place</span><span className="text-right font-medium text-foreground">₦10,000</span>
            <span>🥉 3rd Place</span><span className="text-right font-medium text-foreground">₦5,000</span>
            <span>5× ₦2,000</span><span className="text-right font-medium text-foreground">₦10,000</span>
            <span>10× ₦1,000</span><span className="text-right font-medium text-foreground">₦10,000</span>
            <span>60× ₦500</span><span className="text-right font-medium text-foreground">₦30,000</span>
          </div>
        </div>

        {/* Draw weeks */}
        <div className="space-y-4">
          {DRAW_WEEKS.map((draw, i) => (
            <div key={i} className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {draw.label}
              </p>

              {/* Cash winners */}
              <div className="rounded-2xl bg-surface-1 border border-border p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-1">
                  Cash Prizes
                </p>
                {draw.cashWinners.map((w, j) => (
                  <div key={j} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full ${POSITION_STYLES[j].bg} flex items-center justify-center text-xs font-bold ${POSITION_STYLES[j].text}`}
                      >
                        {POSITION_STYLES[j].label}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium tabular-nums">{w.phone}</span>
                        <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                          <Hash className="h-2.5 w-2.5" />
                          {w.entryId.slice(1)}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">{w.prize}</span>
                  </div>
                ))}
              </div>

              {/* Airtime section */}
              <AirtimeSection tiers={draw.airtimeTiers} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
