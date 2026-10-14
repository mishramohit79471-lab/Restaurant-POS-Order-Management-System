"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ChefHat, UtensilsCrossed, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back!");
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-charcoal p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand">
            <UtensilsCrossed className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xl font-semibold tracking-tight">DineFlow</span>
        </div>
        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight">Run every table, order and bill from one calm screen.</h2>
          <ul className="mt-8 space-y-4 text-white/75">
            {[
              [Zap, "Fast order entry built for busy service"],
              [ChefHat, "Live kitchen status from pending to served"],
              [BarChart3, "Daily sales insight without spreadsheets"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Zap;
              return (
                <li key={text as string} className="flex items-center gap-3">
                  <I className="h-5 w-5 text-brand" aria-hidden />
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="text-sm text-white/40">© {new Date().getFullYear()} DineFlow POS</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
              <UtensilsCrossed className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold">DineFlow</span>
          </div>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">Enter your staff credentials to open the register.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@restaurant.com" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </div>
            <Button type="submit" loading={submitting} className="h-11 w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-lg border border-line bg-white p-3 text-xs text-ink-muted">
            <p className="mb-2 font-medium text-ink">Demo accounts</p>
            <button type="button" className="block w-full rounded px-1 py-0.5 text-left hover:bg-cream" onClick={() => { setEmail("admin@dineflow.com"); setPassword("Admin@123"); }}>
              Admin — admin@dineflow.com
            </button>
            <button type="button" className="block w-full rounded px-1 py-0.5 text-left hover:bg-cream" onClick={() => { setEmail("staff@dineflow.com"); setPassword("Staff@123"); }}>
              Staff — staff@dineflow.com
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
