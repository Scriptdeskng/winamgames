import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { ArrowLeft, Check, ChevronRight, Loader2, ShieldCheck, Trophy } from "lucide-react";
import { z } from "zod";
import React from "react";
import { TopBar } from "@/components/layout/TopBar";
import { getSession } from "@/lib/session";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import { getKycStatus, submitKycBankDetails, submitKycIdentity } from "@/utils/mission.functions";

const searchSchema = z.object({
  winnerId: z.string().optional(),
  step: fallback(z.union([z.literal(1), z.literal(2)]), 1).default(1),
});

export const Route = createFileRoute("/_authed/kyc")({
  validateSearch: zodValidator(searchSchema),
  component: KycPage,
  head: () => ({
    meta: [
      { title: "Claim Prize — WinamGames" },
      { name: "description", content: "Complete winner verification and claim details." },
    ],
  }),
});

type KycStatus = Awaited<ReturnType<typeof getKycStatus>>["kyc"];

const BANKS = [
  { name: "Access Bank", code: "044" },
  { name: "Zenith Bank", code: "057" },
  { name: "GTBank", code: "058" },
  { name: "First Bank", code: "011" },
  { name: "UBA", code: "033" },
  { name: "Fidelity Bank", code: "070" },
  { name: "Sterling Bank", code: "232" },
  { name: "Wema Bank", code: "035" },
  { name: "Stanbic IBTC", code: "221" },
  { name: "Union Bank", code: "032" },
  { name: "Polaris Bank", code: "076" },
  { name: "Keystone Bank", code: "082" },
  { name: "Ecobank", code: "050" },
  { name: "FCMB", code: "214" },
  { name: "Heritage Bank", code: "030" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Providus Bank", code: "101" },
  { name: "Titan Trust Bank", code: "102" },
  { name: "Parallex Bank", code: "526" },
  { name: "Kuda Bank", code: "090267" },
];

function onlyDigits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

function isAdult(dob: string) {
  if (!dob) return false;
  const d = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return d <= cutoff;
}

function KycPage() {
  useAllowScroll();
  const navigate = useNavigate({ from: "/kyc" });
  const search = Route.useSearch();
  const session = getSession();
  const [kyc, setKyc] = React.useState<KycStatus>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!session) return;
    getKycStatus({ data: { playerId: session.playerId } })
      .then((res) => setKyc(res.kyc))
      .finally(() => setLoading(false));
  }, [session?.playerId]);

  const identityLocked = !!kyc?.submitted_at;
  const bankSubmitted = !!kyc?.bank_details_submitted_at;
  const showConfirmation = identityLocked && bankSubmitted && search.step !== 2;
  const step = identityLocked ? 2 : search.step;

  React.useEffect(() => {
    if (identityLocked && !bankSubmitted && search.step === 1) {
      navigate({ search: { ...search, step: 2 }, replace: true });
    }
  }, [identityLocked, bankSubmitted, navigate, search.step]);

  if (!session || loading) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <TopBar backTo="/app" title="Claim Prize" />
      <div className="px-4 pb-8 space-y-4">
        {showConfirmation ? (
          <h1 className="px-1 text-xl font-bold">Claim Prize</h1>
        ) : (
          <ProgressHeader step={step} />
        )}

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-1 to-surface-1 p-5 shadow-card">
          {showConfirmation ? (
            <ReturningWinnerConfirmation
              playerId={session.playerId}
              kyc={kyc}
              onUpdateBank={() => navigate({ search: { ...search, step: 2 } })}
              onDone={() => navigate({ to: "/app" })}
            />
          ) : step === 1 ? (
            <IdentityStep
              playerId={session.playerId}
              onDone={() => {
                setKyc({
                  ...(kyc ?? {}),
                  submitted_at: new Date().toISOString(),
                } as KycStatus);
                navigate({ search: { ...search, step: 2 } });
              }}
            />
          ) : (
            <BankStep
              playerId={session.playerId}
              identityLocked={identityLocked}
              existing={kyc}
              onBack={() => navigate({ search: { ...search, step: 1 } })}
              onDone={() => navigate({ to: "/app" })}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressHeader({ step }: { step: 1 | 2 }) {
  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Step {step} of 2</p>
          <h1 className="text-lg font-bold">
            {step === 1 ? "Identity verification" : "Bank details"}
          </h1>
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: step === 1 ? "50%" : "100%" }} />
      </div>
    </div>
  );
}

function IdentityStep({ playerId, onDone }: { playerId: string; onDone: () => void }) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [dob, setDob] = React.useState("");
  const [idType, setIdType] = React.useState<"nin" | "bvn">("nin");
  const [idNumber, setIdNumber] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !dob || idNumber.length !== 11) {
      setError("Complete all fields. ID number must be exactly 11 digits.");
      return;
    }
    if (!isAdult(dob)) {
      setError("You must be at least 18 years old to claim a cash prize.");
      return;
    }
    setSaving(true);
    try {
      await submitKycIdentity({ data: { playerId, firstName, lastName, dob, idType, idNumber } });
      onDone();
    } catch (err) {
      setError((err as Error).message || "Could not submit identity details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Confirm your identity</h2>
        <p className="mt-1 text-sm text-muted-foreground">We need this to verify your prize claim before payout.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Field label="First name">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="field-input" autoComplete="given-name" />
        </Field>
        <Field label="Last name">
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="field-input" autoComplete="family-name" />
        </Field>
      </div>

      <Field label="Date of birth">
        <div className="overflow-hidden">
          <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="field-input w-full box-border" />
        </div>
      </Field>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">ID type</p>
        <div className="grid grid-cols-2 gap-2">
          {(["nin", "bvn"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setIdType(type)}
              className={`h-11 rounded-xl border text-sm font-semibold uppercase ${
                idType === type ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface-2 text-muted-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <Field label="ID number">
        <input
          inputMode="numeric"
          type="password"
          value={idNumber}
          onChange={(e) => setIdNumber(onlyDigits(e.target.value, 11))}
          className="field-input tracking-[0.3em]"
          placeholder="•••••••••••"
        />
      </Field>

      {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}

      <button disabled={saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ChevronRight className="h-4 w-4" /></>}
      </button>
    </form>
  );
}

function BankStep({
  playerId,
  identityLocked,
  existing,
  onBack,
  onDone,
}: {
  playerId: string;
  identityLocked: boolean;
  existing: KycStatus;
  onBack: () => void;
  onDone: () => void;
}) {
  const existingBank = BANKS.find((b) => b.name === existing?.bank_name) ?? BANKS[0];
  const [bankCode, setBankCode] = React.useState(existingBank.code);
  const [accountNumber, setAccountNumber] = React.useState(existing?.account_number ?? "");
  const [verified, setVerified] = React.useState(existing?.account_number?.length === 10);
  const [resolving, setResolving] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const selectedBank = BANKS.find((b) => b.code === bankCode) ?? BANKS[0];

  React.useEffect(() => {
    setVerified(false);
    if (accountNumber.length !== 10) return;
    setResolving(true);
    const t = window.setTimeout(() => {
      setResolving(false);
      setVerified(true);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [accountNumber, bankCode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (accountNumber.length !== 10 || !verified) {
      setError("Enter and verify a 10-digit account number.");
      return;
    }
    setSaving(true);
    try {
      await submitKycBankDetails({
        data: {
          playerId,
          bankCode,
          bankName: selectedBank.name,
          accountNumber,
          accountName: `${selectedBank.name} Account`,
        },
      });
      onDone();
    } catch (err) {
      setError((err as Error).message || "Could not submit bank details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        {!identityLocked && (
          <button type="button" onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Back to identity
          </button>
        )}
        <h2 className="text-xl font-bold">Where should we pay you?</h2>
        <p className="mt-1 text-sm text-muted-foreground">Bank details can be updated before payout is processed.</p>
      </div>

      <Field label="Bank">
        <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="field-input">
          {BANKS.map((bank) => (
            <option key={bank.code} value={bank.code} className="bg-card text-foreground">
              {bank.name} ({bank.code})
            </option>
          ))}
        </select>
      </Field>

      <Field label="Account number">
        <input
          inputMode="numeric"
          value={accountNumber}
          onChange={(e) => setAccountNumber(onlyDigits(e.target.value, 10))}
          className="field-input tracking-[0.2em]"
          placeholder="0123456789"
        />
      </Field>

      {resolving && (
        <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying account…
        </div>
      )}
      {verified && !resolving && (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs font-medium text-success">
          <Check className="h-3.5 w-3.5" /> {selectedBank.name} — Account verified (name shown at payout)
        </div>
      )}

      {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}

      <button disabled={saving || resolving || !verified} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit claim details"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
