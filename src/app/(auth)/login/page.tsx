"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });

    if (authError) {
      setStatus("error");
      setError(authError.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/60 p-8">
        <div className="mb-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">
            ← Home
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-2">Sign in</h1>
        <p className="text-sm text-slate-400 mb-6">
          We&apos;ll email you a magic link. No password.
        </p>

        {status === "sent" ? (
          <div className="rounded border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-300">
            Check your inbox for <strong>{email}</strong> and click the link to sign in.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:outline-none text-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={status === "sending" || !email}
              className="w-full px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-950 font-semibold transition"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {error && <div className="text-sm text-red-400">{error}</div>}
          </form>
        )}
      </div>
    </main>
  );
}
