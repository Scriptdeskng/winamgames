import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/admin/help")({
  component: HelpCenterPage,
});

const ARTICLES = [{ id: "weekly-draw-runbook", title: "Weekly Draw Runbook" }] as const;

function WarningCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-4 border-amber-500 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
      {children}
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function HelpCenterPage() {
  const [activeArticle, setActiveArticle] = useState<(typeof ARTICLES)[number]["id"]>(
    "weekly-draw-runbook",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guides and reference for WinamGames admin operations
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="lg:w-56">
          <div className="rounded-xl border border-border bg-card p-2">
            {ARTICLES.map((article) => {
              const active = activeArticle === article.id;
              return (
                <button
                  key={article.id}
                  onClick={() => setActiveArticle(article.id)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-primary/15 font-medium text-primary"
                      : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {article.title}
                </button>
              );
            })}
          </div>
        </aside>

        <article className="max-h-[calc(100dvh-11rem)] overflow-y-auto rounded-xl border border-border bg-card p-5 lg:p-6">
          {activeArticle === "weekly-draw-runbook" && <WeeklyDrawRunbook />}
        </article>
      </div>
    </div>
  );
}

function WeeklyDrawRunbook() {
  return (
    <div className="space-y-8 text-sm leading-6 text-muted-foreground">
      <header>
        <h2 className="text-xl font-semibold text-foreground">Weekly Draw Runbook</h2>
      </header>

      <Section title="1. Overview">
        <p>
          The WinamGames weekly draw runs every Sunday. The draw is fully automated — no admin
          action is required for a normal draw cycle.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Time (WAT)</th>
                <th className="px-3 py-2 text-left">Event</th>
                <th className="px-3 py-2 text-left">Trigger</th>
                <th className="px-3 py-2 text-left">Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Mon 00:00", "New draw week opens", "Auto — first player session", "None"],
                ["Sun 19:50", "Entry lock", "Auto — first player session after 19:50", "None"],
                ["Sun 20:00", "Draw execution", "Auto — first player session after 20:00", "None"],
                ["Sun 20:00", "Winners published", "Auto — immediately after execution", "None"],
                ["Sun 20:00", "Week settled", "Auto — immediately after publish", "None"],
              ].map(([time, event, trigger, action]) => (
                <tr key={`${time}-${event}`} className="border-t border-border/60">
                  <td className="px-3 py-2 text-foreground tabular-nums">{time}</td>
                  <td className="px-3 py-2">{event}</td>
                  <td className="px-3 py-2">{trigger}</td>
                  <td className="px-3 py-2">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <WarningCallout>
          The automation triggers on player sessions — not a server cron. If no player opens the
          app after 19:50 or 20:00 WAT, automation will not fire until someone does.
        </WarningCallout>
      </Section>

      <Section title="2. Normal Sunday Flow — No Action Required">
        <ol className="list-decimal space-y-3 pl-5">
          <li>Players earn tickets throughout the week (Mon–Sun).</li>
          <li>
            At 19:50 WAT — first player session triggers auto-lock. Ticket earning stops. Coins
            and XP still awarded.
          </li>
          <li>
            At 20:00 WAT — first player session triggers auto-execute. Winners selected from ticket
            pool.
          </li>
          <li>Winners automatically published — player app shows winners immediately.</li>
          <li>Week automatically settled — new draw week opens on next session.</li>
        </ol>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">How to verify</h3>
          <ol className="list-decimal space-y-3 pl-5">
            <li>Go to Draw management — confirm current week shows Settled or new Open week visible.</li>
            <li>Go to Winners — confirm winners listed for settled week.</li>
            <li>
              Check audit log — confirm draw_lock, draw_execute, winners_publish, draw_settle
              entries with source: auto.
            </li>
            <li>Open player app — confirm winners screen shows results and new countdown running.</li>
          </ol>
        </div>
      </Section>

      <Section title="3. Manual Override — When Automation Fails">
        <WarningCallout>
          Only intervene manually if automation has clearly failed. Check the audit log first.
        </WarningCallout>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock title="Check if automation failed">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Go to /admin/draw.</li>
              <li>Check the draw status after 20:00 WAT.</li>
              <li>Check the audit log for automation entries.</li>
            </ol>
          </InfoBlock>
          <InfoBlock title="Manual Lock">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Click Lock.</li>
              <li>Confirm the action.</li>
              <li>Confirm status changes to Locked.</li>
            </ol>
          </InfoBlock>
          <InfoBlock title="Manual Execute">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Click Execute.</li>
              <li>Type EXECUTE DRAW.</li>
              <li>Confirm the action.</li>
            </ol>
          </InfoBlock>
          <InfoBlock title="Manual Publish">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Find the drawn week in the History table.</li>
              <li>Click the Publish link.</li>
              <li>Confirm winners become visible to players.</li>
            </ol>
          </InfoBlock>
          <InfoBlock title="Manual Settle">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Click Settle.</li>
              <li>Confirm the action.</li>
              <li>Confirm status changes to Settled.</li>
            </ol>
          </InfoBlock>
        </div>
      </Section>

      <Section title="4. Winner Management">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock title="Viewing Winners">
            Go to /admin/winners, expand the week, and review the winner list.
          </InfoBlock>
          <InfoBlock title="KYC Verification">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Player receives the winner banner.</li>
              <li>Player submits required KYC and payout details.</li>
              <li>Admin verifies submitted details.</li>
              <li>Admin confirms actual bank transfer.</li>
              <li>Admin marks the payment as paid.</li>
            </ol>
            <div className="mt-3">
              <WarningCallout>
                Do not mark as paid until actual bank transfer is confirmed.
              </WarningCallout>
            </div>
          </InfoBlock>
          <InfoBlock title="Flagging a Winner">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open /admin/winners.</li>
              <li>Expand the relevant week.</li>
              <li>Flag the winner entry.</li>
              <li>Flag the player if the dispute affects account status.</li>
            </ol>
          </InfoBlock>
          <InfoBlock title="CSV Export">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open /admin/winners.</li>
              <li>Expand the required week.</li>
              <li>Click CSV to download the winner export.</li>
            </ol>
          </InfoBlock>
        </div>
      </Section>

      <Section title="5. Incident Response">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock title="No winners selected">
            This means execution did not produce winner records. Check ticket volume, draw status,
            entry ledger totals, and audit log entries for draw_execute errors.
          </InfoBlock>
          <InfoBlock title="Winners published but player app not showing">
            Check winners_published_week_id in Config and confirm it matches the expected draw week.
          </InfoBlock>
          <InfoBlock title="Settle button inactive">
            The week is not in Drawn status. Check whether execution completed successfully before
            attempting settlement.
          </InfoBlock>
          <InfoBlock title="Emergency">
            Contact engineering with a screenshot of /admin/draw, the audit log, time noticed, and
            steps attempted.
          </InfoBlock>
        </div>
      </Section>

      <Section title="6. Quick Reference">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoBlock title="Draw Schedule">
            <ul className="space-y-1">
              <li>Lock: Sunday 19:50 WAT</li>
              <li>Execute: Sunday 20:00 WAT</li>
              <li>Settle: Sunday ~20:00 WAT (auto)</li>
              <li>New week: Monday 00:00 WAT</li>
            </ul>
          </InfoBlock>
          <InfoBlock title="Prize Tiers">
            <ul className="space-y-1">
              <li>1st place: ₦35,000 cash</li>
              <li>2nd place: ₦10,000 cash</li>
              <li>3rd place: ₦5,000 cash</li>
              <li>4th–78th: ₦200 airtime (75 winners)</li>
            </ul>
          </InfoBlock>
        </div>
      </Section>
    </div>
  );
}