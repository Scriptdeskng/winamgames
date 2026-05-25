"use client";

import {
  Award,
  HelpCircle,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Target,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface AdminSidebarProps {
  email: string;
  onLogout: () => void;
}

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/draw", label: "Draw", icon: Trophy },
  { href: "/admin/players", label: "Players", icon: Users },
  { href: "/admin/content", label: "Content", icon: LayoutGrid },
  { href: "/admin/missions", label: "Missions", icon: Target },
  { href: "/admin/config", label: "Config", icon: Settings },
  { href: "/admin/winners", label: "Winners", icon: Award },
  { href: "/admin/help", label: "Help", icon: HelpCircle },
];

function isActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

interface SidebarContentProps {
  email: string;
  onLogout: () => void;
  onNavigate?: () => void;
}

function SidebarContent({ email, onLogout, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <>
      <div className="flex items-center gap-2.5 border-b border-border p-4">
        <div className="flex items-center gap-2.5">
          <img src="/winam-logo.png" alt="WinamGames" className="h-7 w-auto" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/15 font-medium text-primary"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <div className="px-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Logged in as
          </p>
          <p className="truncate text-sm font-medium" title={email}>
            {email}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </>
  );
}

export default function AdminSidebar({ email, onLogout }: AdminSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-surface-1 lg:flex">
        <SidebarContent email={email} onLogout={onLogout} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface-1 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <img src="/winam-logo.png" alt="WinamGames" className="h-6 w-auto" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-border bg-surface-1">
            <button
              type="button"
              onClick={closeMobile}
              className="absolute right-3 top-3 rounded-md p-2 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              email={email}
              onLogout={() => {
                onLogout();
                closeMobile();
              }}
              onNavigate={closeMobile}
            />
          </aside>
        </div>
      )}
    </>
  );
}
