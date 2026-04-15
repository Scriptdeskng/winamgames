import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/renew")({
  component: RenewPage,
  head: () => ({
    meta: [{ title: "Renew Subscription — WinamGames" }],
  }),
});

function RenewPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col items-center justify-center px-6">
      <div className="h-16 w-16 rounded-2xl bg-warning/15 flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8 text-warning" />
      </div>
      <h1 className="text-xl font-bold text-center">Subscription Inactive</h1>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-[280px]">
        Your WinamGames subscription has expired. Renew to keep playing and earning draw entries.
      </p>
      <button className="mt-8 w-full max-w-[280px] h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-glow">
        <RefreshCw className="h-5 w-5" />
        Renew Subscription
      </button>
      <p className="mt-4 text-xs text-muted-foreground text-center">
        MTN Nigeria • Daily or Weekly plans
      </p>
    </div>
  );
}
