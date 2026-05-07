"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { getSubscriptionStatus } from "@/lib/api";
import { getSession } from "@/lib/session";

export default function RenewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    getSubscriptionStatus(session.playerId)
      .then((result) => setStatus(result?.data ?? result))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load subscription status"))
      .finally(() => setLoading(false));
  }, [router]);

  const redirectUrl = status?.client_action?.redirection_url || "/subscribe";

  const goToIntelli = () => {
    window.location.href = redirectUrl;
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col">
      <div className="px-5 pt-5">
        <Link href="/" aria-label="WinamGames home">
          <img src="/winam-logo.png" alt="WinamGames" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/app" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">Subscription status</h1>
            <p className="text-sm text-muted-foreground">
              {status?.has_active_subscription ? "Your Intelli subscription is active." : "Your access is inactive right now."}
            </p>
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <div className="rounded-xl border border-border bg-surface-1 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {status?.has_active_subscription ? "Managed by Intelli" : "Use Intelli to renew or subscribe"}
            </div>
            <p className="text-sm font-semibold">
              {status?.has_active_subscription ? "You're active" : "Tap below to continue to Intelli"}
            </p>
            <p className="text-xs text-muted-foreground">
              {status?.has_active_subscription
                ? `Valid until ${status?.active_subscription?.ends_date ? new Date(status.active_subscription.ends_date).toLocaleDateString() : "unknown"}`
                : "Intelli will return a redirection link for subscription or renewal."}
            </p>
          </div>

          <button
            onClick={goToIntelli}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-glow transition-all hover:opacity-90 flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Continue to Intelli
          </button>
        </div>
      </div>
    </main>
  );
}
