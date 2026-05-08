"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MenuSheet } from "@/components/menu-sheet";
import { getSession } from "@/lib/session";

type PlayerTopBarProps = {
  backTo?: string;
  title?: string;
};

export function PlayerTopBar({ backTo, title }: PlayerTopBarProps) {
  const session = getSession();
  const initial = session?.nickname?.[0]?.toUpperCase() ?? "W";
  const isSubPage = Boolean(backTo);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      {isSubPage ? (
        <Link
          href={backTo!}
          className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
      ) : (
        <Link
          href="/profile"
          className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
          aria-label="Profile"
        >
          <span className="text-sm font-bold text-primary">{initial}</span>
        </Link>
      )}

      {isSubPage ? (
        <span className="text-base font-bold text-foreground truncate max-w-[200px]">{title ?? ""}</span>
      ) : (
        <img src="/winam-logo.png" alt="WinamGames" className="h-7 w-auto" />
      )}

      {isSubPage ? <div className="h-10 w-10" aria-hidden /> : <MenuSheet />}
    </div>
  );
}
