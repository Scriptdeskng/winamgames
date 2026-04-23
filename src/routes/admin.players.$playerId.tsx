import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/players/$playerId")({
  component: () => {
    const { playerId } = Route.useParams();
    return (
      <div>
        <h1 className="text-2xl font-bold">Player detail</h1>
        <p className="mt-2 text-sm text-muted-foreground">ID: {playerId}</p>
      </div>
    );
  },
});
