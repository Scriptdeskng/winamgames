import { createFileRoute, useNavigate, useLocation, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getAdminSession,
  clearAdminSession,
  verifyAdminSession,
  type AdminSession,
} from "@/utils/admin.auth";
import { AdminSidebar } from "./-admin/AdminSidebar";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const local = getAdminSession();
    if (!local) {
      navigate({ to: "/admin/login" });
      return;
    }
    verifyAdminSession({ data: { adminId: local.adminId } })
      .then((r) => {
        if (!r.valid) {
          clearAdminSession();
          navigate({ to: "/admin/login" });
          return;
        }
        setSession(r.session);
        setReady(true);
      })
      .catch(() => {
        clearAdminSession();
        navigate({ to: "/admin/login" });
      });
  }, [navigate]);

  if (!ready || !session) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <AdminSidebar
        email={session.email}
        onLogout={() => {
          clearAdminSession();
          navigate({ to: "/admin/login" });
        }}
      />
      <main className="lg:pl-60">
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
