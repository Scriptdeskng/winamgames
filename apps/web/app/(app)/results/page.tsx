import { Suspense } from "react";
import ResultsPage from "@/components/pages/ResultsPage";

export default function Page() {
  return (
    <Suspense>
      <ResultsPage />
    </Suspense>
  );
}
