"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { adminLogin } from "@/lib/admin-api";
import { getAdminSession, setAdminSession } from "@/lib/admin-session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (getAdminSession()) router.replace("/admin");
  }, [router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await adminLogin(email, password);
      if (!res.success || !res.session) {
        setErr(res.error || "Login failed");
        return;
      }
      setAdminSession(res.session);
      router.replace("/admin");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-background flex items-center justify-center p-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">WinamGames Admin</h1>
          <p className="text-xs text-muted-foreground">Restricted access</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-surface-1 border border-border p-5 space-y-4 shadow-card">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" className="w-full h-10 rounded-md bg-background border border-border px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary" required />
          </div>
          {err && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
          <button type="submit" disabled={busy} className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50">
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
