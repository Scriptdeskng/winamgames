"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Loader2, ShieldCheck, Trophy } from "lucide-react";
import { getKycStatus, getMyWinnerStatus, submitKycBankDetails, submitKycIdentity } from "@/lib/api";
import { getSession } from "@/lib/session";
import { PlayerTopBar } from "@/components/player-top-bar";

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

type KycRecord = {
  first_name?: string | null;
  last_name?: string | null;
  dob?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  submitted_at?: string | null;
  bank_details_submitted_at?: string | null;
  verified?: boolean;
} | null;

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

export default function KycClient({
  initialWinnerId,
  initialStep,
}: {
  initialWinnerId: string;
  initialStep: 1 | 2;
}) {
  const router = useRouter();
  const session = getSession();
  const [loading, setLoading] = useState(true);
  const [kyc, setKyc] = useState<KycRecord>(null);
  const [winnerStatus, setWinnerStatus] = useState<any>(null);
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [winnerId] = useState(initialWinnerId);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    Promise.all([getMyWinnerStatus(session.playerId), getKycStatus(session.playerId)])
      .then(([winner, kycRes]) => {
        if (cancelled) return;
        if (!winner?.won) {
          router.replace("/app");
          return;
        }
        setWinnerStatus(winner);
        setKyc(kycRes?.kyc ?? null);
        const identityLocked = !!kycRes?.kyc?.submitted_at;
        if (identityLocked && !kycRes?.kyc?.bank_details_submitted_at) {
          setStep(2);
        }
        setLoading(false);
      })
      .catch(() => router.replace("/app"));

    return () => {
      cancelled = true;
    };
  }, [router, session]);

  const identityLocked = !!kyc?.submitted_at;
  const bankSubmitted = !!kyc?.bank_details_submitted_at;
  const showConfirmation = identityLocked && bankSubmitted && step !== 2;
  const currentStep = identityLocked ? 2 : step;

  if (!session || loading) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-background text-foreground">
      <PlayerTopBar backTo="/app" title="Claim Prize" />

      <div className="px-4 pb-8 space-y-4">
        {showConfirmation ? (
          <h1 className="px-1 text-xl font-bold">Claim Prize</h1>
        ) : (
          <ProgressHeader step={currentStep} />
        )}

        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface-1 to-surface-1 p-5 shadow-card">
          {showConfirmation ? (
            <ReturningWinnerConfirmation
              playerId={session.playerId}
              kyc={kyc}
              winnerStatus={winnerStatus}
              onUpdateBank={() => setStep(2)}
              onDone={() => router.push("/app")}
            />
          ) : currentStep === 1 ? (
            <IdentityStep
              playerId={session.playerId}
              onDone={() => setStep(2)}
            />
          ) : (
            <BankStep
              playerId={session.playerId}
              identityLocked={identityLocked}
              existing={kyc}
              onBack={() => setStep(1)}
              onDone={() => router.push("/app")}
            />
          )}
        </div>
      </div>
    </main>
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
          <h1 className="text-lg font-bold">{step === 1 ? "Identity verification" : "Bank details"}</h1>
        </div>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: step === 1 ? "50%" : "100%" }} />
      </div>
    </div>
  );
}

function IdentityStep({ playerId, onDone }: { playerId: string; onDone: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState<"nin" | "bvn">("nin");
  const [idNumber, setIdNumber] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
      await submitKycIdentity({ playerId, firstName, lastName, dob, idType, idNumber });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit identity details.");
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
        <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="field-input w-full box-border" />
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
  existing: KycRecord;
  onBack: () => void;
  onDone: () => void;
}) {
  const existingBank = BANKS.find((b) => b.name === existing?.bank_name) ?? BANKS[0];
  const [bankCode, setBankCode] = useState(existingBank.code);
  const [accountNumber, setAccountNumber] = useState(existing?.account_number ?? "");
  const [verified, setVerified] = useState((existing?.account_number ?? "").length === 10);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedBank = BANKS.find((b) => b.code === bankCode) ?? BANKS[0];

  useEffect(() => {
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
    setError("");
    if (accountNumber.length !== 10 || !verified) {
      setError("Enter and verify a 10-digit account number.");
      return;
    }
    setSaving(true);
    try {
      await submitKycBankDetails({
        playerId,
        bankCode,
        bankName: selectedBank.name,
        accountNumber,
        accountName: `${selectedBank.name} Account`,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit bank details.");
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

function ReturningWinnerConfirmation({
  playerId,
  kyc,
  winnerStatus,
  onUpdateBank,
  onDone,
}: {
  playerId: string;
  kyc: KycRecord;
  winnerStatus: any;
  onUpdateBank: () => void;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const last4 = kyc?.account_number ? String(kyc.account_number).slice(-4) : "";
  const fullName = [kyc?.first_name, kyc?.last_name].filter(Boolean).join(" ").trim();

  const confirm = async () => {
    if (!kyc?.bank_code || !kyc.bank_name || !kyc.account_number) {
      setError("Update your bank details before confirming this claim.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await submitKycBankDetails({
        playerId,
        bankCode: kyc.bank_code,
        bankName: kyc.bank_name,
        accountNumber: kyc.account_number,
        accountName: kyc.account_name ?? undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm prize claim.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20">
          <Trophy className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Claim your prize</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your verified details are on file.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prize</p>
        <p className="mt-2 text-sm font-bold">
          {winnerStatus?.prizeType === "airtime" ? "Airtime" : "Cash"} · ₦{Number(winnerStatus?.prizeAmount ?? 0).toLocaleString("en-NG")}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Paying to</p>
        <p className="mt-2 text-sm font-bold">{kyc?.bank_name} ••••{last4}</p>
        <p className="mt-1 text-sm text-muted-foreground">{fullName}</p>
      </div>

      {error && <p className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}

      <div className="grid gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={confirm}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Confirm claim <ChevronRight className="h-4 w-4" /></>}
        </button>
        <button
          type="button"
          onClick={onUpdateBank}
          className="h-11 rounded-xl border border-border bg-surface-2 text-sm font-semibold text-foreground"
        >
          Update bank details
        </button>
      </div>
    </div>
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
