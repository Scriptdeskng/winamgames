import { Suspense } from "react";
import KycPage from "@/components/pages/KycPage";

export default function Page() {
  return (
    <Suspense>
      <KycPage />
    </Suspense>
  );
}
