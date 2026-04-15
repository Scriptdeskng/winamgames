import { Outlet } from "@tanstack/react-router";

export function AppShell() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] relative bg-background">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
