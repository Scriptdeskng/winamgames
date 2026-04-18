import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { sendOtp } from "@/utils/auth.functions";
import { getSession } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthFrame } from "@/components/auth/AuthFrame";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Login — WinamGames" },
      { name: "description", content: "Enter your phone number to play WinamGames." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [msisdn, setMsisdn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleaned = msisdn.replace(/\s/g, "");
    if (!/^0[789]\d{9}$/.test(cleaned) && !/^\+234[789]\d{9}$/.test(cleaned)) {
      setError("Enter a valid Nigerian mobile number");
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp({ data: { msisdn: cleaned } });
      if (!result.success) {
        setError(result.error || "Failed to send OTP");
        return;
      }
      navigate({ to: "/verify", search: { msisdn: cleaned } });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your number to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-muted-foreground">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={msisdn}
            onChange={(e) => setMsisdn(e.target.value)}
            placeholder="08012345678"
            autoFocus
            className="h-12 rounded-xl bg-surface-2 border-border"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={loading || msisdn.length < 10}
          className="w-full h-12 rounded-xl shadow-glow"
        >
          {loading ? "Sending..." : "Send code"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/renew" className="text-primary font-medium hover:underline">
          Subscribe
        </Link>
      </p>
    </AuthFrame>
  );
}
