import { Suspense } from "react";
import VerifyClient from "./verify-client";

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] bg-background flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </main>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}

