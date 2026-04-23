import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/players")({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold">Players</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Server functions ready: getPlayers, flagPlayer, adjustPlayerCoins, adjustPlayerXP,
        updateSubscription.
      </p>
    </div>
  ),
});
