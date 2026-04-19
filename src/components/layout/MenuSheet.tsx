import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Home, Trophy, Ticket, Award } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/leaderboard", icon: Trophy, label: "Leaderboard" },
  { to: "/entries", icon: Ticket, label: "My Tickets" },
  { to: "/winners", icon: Award, label: "Winners" },
] as const;

export function MenuSheet() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Menu
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-surface-1"
                  )}
                >
                  <item.icon className="h-5 w-5" />
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
