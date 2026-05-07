export type SubscriptionPlan = "daily" | "weekly" | "monthly";

const PLAN_URLS: Record<SubscriptionPlan, string> = {
  daily: "http://checkout.mtn-ng.dcbprotect.com/v3/lp/mtn-ng/59/video-entertainment-service-02",
  weekly: "http://checkout.mtn-ng.dcbprotect.com/v3/lp/mtn-ng/58/video-entertainment-service-01",
  monthly: "http://checkout.mtn-ng.dcbprotect.com/v3/lp/mtn-ng/60/video-entertainment-service-03",
};

const ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function randomTrxId(length = 16) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHANUMERIC[byte % ALPHANUMERIC.length]).join("");
}

export function buildCheckoutUrl(plan: SubscriptionPlan) {
  const url = new URL(PLAN_URLS[plan]);
  url.searchParams.set("trfsrc", "winam");
  url.searchParams.set("trxId", randomTrxId(16));
  return url.toString();
}

export const subscriptionPlans = [
  {
    key: "weekly" as const,
    label: "Weekly",
    badge: "Best value",
    description: "7 days of full access",
    price: "N300",
    priceSuffix: "/week",
    note: "All games, Tickets, Missions",
  },
  {
    key: "daily" as const,
    label: "Daily",
    badge: "",
    description: "Access for today only",
    price: "N150",
    priceSuffix: "/day",
    note: "Great for a quick play session",
  },
  {
    key: "monthly" as const,
    label: "Monthly",
    badge: "",
    description: "30 days of access",
    price: "—",
    priceSuffix: "",
    note: "Best for long-term players",
  },
] as const;
