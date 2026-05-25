"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import MenuSheet from "@/components/layout/MenuSheet";
import { sessionStore } from "@/lib/session";
import { cn } from "@/lib/utils";

export interface TopBarProps {
  backTo?: string;
  title?: string;
  className?: string;
}

export default function TopBar({ backTo, title, className }: TopBarProps) {
  const session = sessionStore.get();
  const initial = session?.player.nickname?.[0]?.toUpperCase() ?? "?";

  return (
    <header className={cn("-mx-4 px-4 pb-2 pt-4", className)}>
      <div className="flex items-center justify-between">
      {backTo ? (
        <Link
          href={backTo}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-1"
          aria-label="Go back"
        >
          <ChevronLeft className="size-5 text-foreground" />
        </Link>
      ) : (
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-1 text-sm font-bold text-foreground hover:border-primary/40 transition-colors"
          aria-label="View profile"
        >
          {initial}
        </Link>
      )}

      {backTo && title ? (
        <h1 className="flex-1 truncate px-3 text-center text-base font-semibold text-foreground">
          {title}
        </h1>
      ) : (
        <img src="/winam-logo.png" alt="WinamGames" className="h-6 w-auto mx-auto" />
      )}

      {backTo ? <div className="h-10 w-10 shrink-0" /> : <MenuSheet />}
      </div>
    </header>
  );
}
