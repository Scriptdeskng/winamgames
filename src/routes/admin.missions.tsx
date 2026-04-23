import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/missions")({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold">Missions</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Server functions ready: getMissions, createMission, updateMission.
      </p>
    </div>
  ),
});
