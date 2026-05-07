"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { verifyAdminSession } from "@/lib/admin-api";
import { clearAdminSession, getAdminSession, setAdminSession } from "@/lib/admin-session";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setReady(true);
      return;
    }
    const session = getAdminSession();
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    verifyAdminSession(session.adminId)
      .then((result) => {
        if (!result.valid || !result.session) {
          clearAdminSession();
          router.replace("/admin/login");
          return;
        }
        setAdminSession(result.session);
        setReady(true);
      })
      .catch(() => {
        clearAdminSession();
        router.replace("/admin/login");
      });
  }, [pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (!ready) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
