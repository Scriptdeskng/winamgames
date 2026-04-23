import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Trophy,
  Users,
  Image as ImageIcon,
  Target,
  Settings,
  Award,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface Props {
  email: string;
  onLogout: () => void;
}

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/draw", label: "Draw", icon: Trophy },
  { to: "/admin/players", label: "Players", icon: Users },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },
  { to: "/admin/missions", label: "Missions", icon: Target },
  { to: "/admin/config", label: "Config", icon: Settings },
  { to: "/admin/winners", label: "Winners", icon: Award },
] as const;

export function AdminSidebar({ email, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const Inner = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <span className="text-primary text-sm font-bold">W</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-foreground">WinamGames</span>
          <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
            Admin
          </span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? loc.pathname === item.to
            : loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
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
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Logged in as
          </p>
          <p className="text-xs text-foreground truncate" title={email}>
            {email}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-60 lg:bg-surface-1 lg:border-r lg:border-border">
        <Inner />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-surface-1 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center">
            <span className="text-primary text-xs font-bold">W</span>
          </div>
          <span className="text-sm font-semibold">WinamGames Admin</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md hover:bg-surface-2"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-surface-1 border-r border-border">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-surface-2"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Inner />
          </div>
        </div>
      )}
    </>
  );
}
