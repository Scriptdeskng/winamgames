"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { adminLogin, getAdminSessionFromServer } from "@/lib/api";
import { setAdminSession } from "@/lib/admin-session";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    void getAdminSessionFromServer()
      .then((result) => {
        if (result.valid && result.session) {
          setAdminSession({
            adminId: result.session.adminId,
            email: result.session.email,
            expires_at: new Date((result.expiresAt ?? Date.now() / 1000) * 1000).toISOString(),
          });
          router.push("/admin");
        }
      })
      .catch(() => {
        // ignore session bootstrap errors
      });
  }, [router]);

  const onSubmit = async (data: LoginFormValues) => {
    setErr(null);
    setBusy(true);

    const { email, password } = data;
    try {
      const result = await adminLogin(email, password);
      if (!result.success) {
        throw new Error("Invalid credentials");
      }
      setAdminSession({
        adminId: result.adminId,
        email: result.email,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      router.push("/admin");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Invalid credentials");
    }

    setBusy(false);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">WinamGames Admin</h1>
          <p className="text-xs text-muted-foreground">Restricted access</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl border border-border bg-surface-1 p-5"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {err && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-10 w-full rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
