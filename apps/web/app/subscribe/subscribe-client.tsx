"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { getSession } from "@/lib/session";

export default function SubscribeClient() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirectUrl") || getSession()?.subscriptionRedirectUrl || "";
  const session = getSession();
  const active = session?.subscriptionActive;

  const handleRedirect = () => {
    if (!redirectUrl) return;
    window.location.href = redirectUrl;
  };

  return (
    <main className="min-h-[100dvh] bg-background flex flex-col">
      <div className="px-5 pt-5">
        <Link href="/" aria-label="WinamGames home">
          <img src="/winam-logo.png" alt="WinamGames" className="h-8 w-auto" />
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 pb-10">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>

          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground">{active ? "Manage subscription" : "Subscribe to play"}</h1>
            <p className="text-sm text-muted-foreground">
              {active
                ? "Your access is active. You can continue playing right away."
                : "Intelli handles billing and subscription management for WinamGames."}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface-1 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Keep your Winam access active</p>
                <p className="text-xs text-muted-foreground">Subscribe through Intelli, then return to continue earning tickets.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" /> Carrier billing</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> Managed by Intelli</span>
            </div>
          </div>

          <button
            onClick={handleRedirect}
            disabled={!redirectUrl}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-glow transition-all hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {redirectUrl ? "Continue to Intelli" : "Waiting for subscription link"}
          </button>

          {!redirectUrl && (
            <p className="text-center text-xs text-muted-foreground">
              Please go back to login and verify again, or wait for your subscription link to arrive.
            </p>
          )}

          <p className="text-center text-[10px] text-muted-foreground">MTN Nigeria carrier billing • Cancel anytime through Intelli</p>
        </div>
      </div>
    </main>
  );
}
