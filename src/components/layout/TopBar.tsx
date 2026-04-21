import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MenuSheet } from "./MenuSheet";
import { getSession } from "@/lib/session";
import logo from "@/assets/winam-logo.png";

interface TopBarProps {
  backTo?: string;
  title?: string;
}

export function TopBar({ backTo, title }: TopBarProps) {
  const session = getSession();
  const initial = session?.nickname?.[0]?.toUpperCase() ?? "W";
  const isSubPage = Boolean(backTo);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {isSubPage ? (
        <Link
          to={backTo}
          className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
      ) : (
        <Link
          to="/profile"
          className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          aria-label="Profile"
        >
          <span className="text-sm font-bold text-primary">{initial}</span>
        </Link>
      )}

      {isSubPage ? (
        <span className="text-base font-bold text-foreground truncate max-w-[200px]">
          {title ?? ""}
        </span>
      ) : (
        <img src={logo} alt="WinAm" className="h-7 w-auto" />
      )}

      {isSubPage ? <div className="h-10 w-10" aria-hidden /> : <MenuSheet />}
    </div>
  );
}
