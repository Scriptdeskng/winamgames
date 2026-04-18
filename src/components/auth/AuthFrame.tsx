import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface AuthFrameProps {
  children: ReactNode;
  back?: { to: string; label?: string };
}

export function AuthFrame({ children, back }: AuthFrameProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[430px] min-h-[680px] rounded-3xl border border-border bg-surface-1 shadow-card p-6 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gradient-emerald">WinamGames</span>
          {back && (
            <Link
              to={back.to}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← {back.label ?? "Back"}
            </Link>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">{children}</div>
      </div>
    </div>
  );
}
