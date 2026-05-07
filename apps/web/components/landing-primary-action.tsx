"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/session";
import { getSubscriptionStatus } from "@/lib/api";

type Props = {
  className: string;
  labelClassName?: string;
  iconClassName?: string;
};

export function LandingPrimaryAction({ className, labelClassName = "", iconClassName = "" }: Props) {
  const [href, setHref] = useState("/login");
  const [label, setLabel] = useState("Play now");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setHref("/login");
      setLabel("Play now");
      setLoading(false);
      return;
    }

    let cancelled = false;
    getSubscriptionStatus(session.playerId)
      .then((response) => {
        if (cancelled) return;
        const subscription = response?.data ?? response;
        const active = !!subscription?.has_active_subscription;
        const redirectUrl = subscription?.client_action?.redirection_url || session.subscriptionRedirectUrl || null;
        setHref(active ? "/app" : redirectUrl || "/renew");
        setLabel(active ? "Continue to app" : redirectUrl ? "Continue to renewal" : "Manage subscription");
      })
      .catch(() => {
        if (cancelled) return;
        setHref("/login");
        setLabel("Play now");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = () => {
    if (href.startsWith("http")) {
      window.location.href = href;
      return;
    }
    window.location.assign(href);
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      <span className={labelClassName}>{loading ? "Checking..." : label}</span>
      <ArrowRight className={iconClassName} />
    </button>
  );
}
