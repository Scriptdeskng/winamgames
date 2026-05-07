"use client";

import { Suspense } from "react";
import SubscriptionPlans from "@/components/subscription-plans";

export default function RenewPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] bg-background flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </main>
      }
    >
      <SubscriptionPlans mode="renew" />
    </Suspense>
  );
}
