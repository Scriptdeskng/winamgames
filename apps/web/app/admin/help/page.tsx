"use client";

export default function AdminHelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Guides and reference for WinamGames admin operations</p>
      </div>

      <section className="space-y-4">
        <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">Weekly Draw Runbook</h2>
        <div className="rounded-xl border border-border bg-surface-1 p-4 text-sm leading-6 text-muted-foreground">
          <p className="font-medium text-foreground">The weekly draw is fully automated.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>Mon 00:00: new draw week opens.</li>
            <li>Sun 19:50: entry lock on first player session after the cut-off.</li>
            <li>Sun 20:00: draw execution and winner publication.</li>
            <li>Sun 20:00+: settlement and rollover.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
          If automation fails, use the Draw page to lock, execute, publish, and settle manually.
        </div>
      </section>
    </div>
  );
}
