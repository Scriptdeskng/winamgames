"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, Trophy, Ticket, Award } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", icon: Home, label: "Home" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { href: "/entries", icon: Ticket, label: "My Tickets" },
  { href: "/winners", icon: Award, label: "Winners" },
] as const;

export function MenuSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border border-border/70 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-2 pt-2">
            <SheetTitle className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-[0.22em]">
              Menu
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors",
                    active
                      ? "bg-primary/12 text-primary"
                      : "text-foreground hover:bg-surface-1/80",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
