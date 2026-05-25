"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getPlayerSession } from "@/lib/api";
import { sessionStore } from "@/lib/session";

interface AppLayoutProps {
  children: ReactNode;
}

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getPlayerSession()
      .then((result) => {
        if (result.valid && result.player) {
          sessionStore.set({
            player: {
              id: result.player.id,
              msisdn_hash: "",
              nickname: result.player.nickname ?? "Player",
              coins: result.player.coinBalance ?? 0,
              xp: result.player.xpTotal ?? 0,
              rank: result.player.rankTier ?? "starter",
              streak: result.player.currentStreak ?? 0,
              streak_last_date: null,
              created_at: result.player.createdAt ?? new Date().toISOString(),
            },
            expires_at: new Date((result.expiresAt ?? Date.now() / 1000) * 1000).toISOString(),
          });
          setReady(true);
          return;
        }
        router.replace("/login");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return children;
}
