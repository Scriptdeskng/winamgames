import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MenuSheet } from "./MenuSheet";
import { getSession } from "@/lib/session";

interface TopBarProps {
  backTo?: string;
}

export function TopBar({ backTo }: TopBarProps) {
  const session = getSession();
  const initial = session?.nickname?.[0]?.toUpperCase() ?? "W";

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {backTo ? (
        <Link
          to={backTo}
          className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
      ) : (
        <Link
          to="/profile"
          className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
        >
          <span className="text-sm font-bold text-primary">{initial}</span>
        </Link>
      )}

      <span className="text-base font-bold text-foreground">WinamGames</span>

      <MenuSheet />
    </div>
  );
}
