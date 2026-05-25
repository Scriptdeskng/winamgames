"use client";

import type { LucideIcon } from "lucide-react";
import { Award, Home, Menu, Ticket, Trophy, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/app", icon: Home },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "My Tickets", href: "/entries", icon: Ticket },
  { label: "Winners", href: "/winners", icon: Award },
];

export interface MenuSheetProps {
  className?: string;
}

export default function MenuSheet({ className }: MenuSheetProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-1",
            className,
          )}
        >
          <Menu className="size-5 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-0 rounded-t-2xl border-t border-primary bg-background p-0"
      >
        <VisuallyHidden>
          <SheetTitle>Navigation Menu</SheetTitle>
        </VisuallyHidden>
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="h-8 w-8 shrink-0" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
            MENU
          </p>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-primary"
          >
            <X className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="space-y-0 px-4 pb-5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname != null &&
              (pathname === item.href || pathname.startsWith(`${item.href}/`));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-surface-1",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2 : 1.75} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
