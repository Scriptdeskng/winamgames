"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { buildCheckoutUrl, subscriptionPlans, type SubscriptionPlan } from "@/lib/subscription-checkout";

type Props = {
  mode: "subscribe" | "renew";
};

export default function SubscriptionPlans({ mode }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("weekly");

  const title = mode === "renew" ? "Choose your plan" : "Subscribe to play";
  const subtitle =
    mode === "renew"
      ? "Pick the plan that fits how you want to play."
      : "Intelli handles billing and subscription management for WinamGames.";

  const ctaLabel = useMemo(() => {
    const plan = subscriptionPlans.find((item) => item.key === selectedPlan);
    return plan ? `Continue with ${plan.label}` : "Continue to Intelli";
  }, [selectedPlan]);

  const handleRedirect = () => {
    const checkoutUrl = buildCheckoutUrl(selectedPlan);
    const tab = window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    if (tab) {
      tab.opener = null;
    }
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
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="space-y-3">
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
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary" /> Carrier billing
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-primary" /> Managed by Intelli
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {subscriptionPlans.map((plan) => {
                const selected = plan.key === selectedPlan;
                return (
                  <button
                    key={plan.key}
                    type="button"
                    onClick={() => setSelectedPlan(plan.key)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      selected ? "border-primary bg-primary/10 shadow-glow" : "border-border bg-surface-1 hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{plan.label}</p>
                          {plan.badge ? (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">{plan.badge}</span>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{plan.price}</p>
                        {plan.priceSuffix ? <p className="text-[10px] text-muted-foreground">{plan.priceSuffix}</p> : null}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-primary" /> {plan.note}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRedirect}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-glow transition-all hover:opacity-90 flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {ctaLabel} →
          </button>

          <p className="text-center text-xs text-muted-foreground">MTN Nigeria carrier billing • Cancel anytime through Intelli</p>
        </div>
      </div>
    </main>
  );
}
