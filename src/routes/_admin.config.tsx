import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/config")({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold">Platform config</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Server functions ready: getPlatformConfig, updatePlatformConfig.
      </p>
    </div>
  ),
});
