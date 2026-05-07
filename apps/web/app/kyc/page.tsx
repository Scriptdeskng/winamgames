import KycClient from "./kyc-client";

export default async function KycPage({
  searchParams,
}: {
  searchParams?: Promise<{ winnerId?: string; step?: string }>;
}) {
  const params = (searchParams ? await searchParams : {}) ?? {};
  return <KycClient initialWinnerId={params.winnerId ?? ""} initialStep={params.step === "2" ? 2 : 1} />;
}
