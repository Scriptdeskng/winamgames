import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/winners")({
  component: () => (
    <div>
      <h1 className="text-2xl font-bold">Winners</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Server functions ready: getDrawWeeks, getWinners, flagWinner.
      </p>
    </div>
  ),
});
