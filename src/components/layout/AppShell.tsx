import { Outlet } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] relative bg-background">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
