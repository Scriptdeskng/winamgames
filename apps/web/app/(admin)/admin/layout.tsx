"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import useAllowScroll from "@/hooks/useAllowScroll";
import { getAdminSessionFromServer, logoutAdmin } from "@/lib/api";
import {
  clearAdminSession,
  setAdminSession,
  type AdminSession,
} from "@/lib/admin-session";

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  );
}

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/admin/login";
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoginRoute) {
      setReady(true);
      return;
    }

    void getAdminSessionFromServer()
      .then((result) => {
        if (result.valid && result.session) {
          const nextSession: AdminSession = {
            adminId: result.session.adminId,
            email: result.session.email,
            expires_at: new Date((result.expiresAt ?? Date.now() / 1000) * 1000).toISOString(),
          };
          setAdminSession(nextSession);
          setSession(nextSession);
          setReady(true);
          return;
        }
        router.push("/admin/login");
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [pathname, isLoginRoute, router]);

  useAllowScroll();

  if (isLoginRoute && ready) {
    return children;
  }

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  if (ready && session) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground">
        <AdminSidebar
          email={session.email}
          onLogout={() => {
            void logoutAdmin().catch(() => {
              // ignore logout errors
            });
            clearAdminSession();
            router.push("/admin/login");
          }}
        />
        <main className="lg:pl-60">
          <div className="mx-auto max-w-6xl p-4 lg:p-6">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <Spinner />
    </div>
  );
}
