"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BadgeInfo,
  Bell,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Target,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clearAdminSession, getAdminSession } from "@/lib/admin-session";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/draw", label: "Draw", icon: Trophy },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/winners", label: "Winners", icon: Award },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/missions", label: "Missions", icon: Target },
  { href: "/admin/intelli", label: "Intelli", icon: Bell },
  { href: "/admin/config", label: "Config", icon: Settings },
  { href: "/admin/help", label: "Help", icon: BadgeInfo },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = getAdminSession();
  const [open, setOpen] = useState(false);

  const activeLabel = useMemo(() => NAV.find((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)))?.label ?? "Admin", [pathname]);

  const logout = () => {
    clearAdminSession();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border lg:bg-surface-1">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <span className="text-primary text-sm font-bold">W</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-foreground">WinamGames</span>
            <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Admin</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3 space-y-2">
          <div className="px-2 py-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Logged in as</p>
            <p className="text-xs text-foreground truncate" title={session?.email ?? ""}>
              {session?.email ?? "Admin"}
            </p>
          </div>
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface-1 px-4 py-3 lg:hidden">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">Admin</p>
          <p className="text-sm font-semibold">{activeLabel}</p>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 rounded-md hover:bg-surface-2" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-surface-1 border-r border-border">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 p-1 rounded-md hover:bg-surface-2" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
              <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <span className="text-primary text-sm font-bold">W</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-foreground">WinamGames</span>
                <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">Admin</span>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      active ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-border p-3">
              <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
