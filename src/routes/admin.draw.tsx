import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/draw")({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold">Draw management</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Lock, execute, publish and settle weekly draws. (Wiring in progress — server functions are
        ready: lockDrawWeek, executeDrawWeek, publishWinners, settleDrawWeek.)
      </p>
    </div>
  ),
});
