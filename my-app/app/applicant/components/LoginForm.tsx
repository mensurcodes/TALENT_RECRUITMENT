"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginApplicant } from "../actions";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") ?? "");
    const password = String(fd.get("password") ?? "");
    setError(null);
    setPending(true);
    const r = await loginApplicant(username, password);
    setPending(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    router.push("/applicant/jobs");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-sm space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-xl"
    >
      <div className="mb-6 text-center">
        <p className="text-base font-semibold text-white">Welcome back</p>
        <p className="mt-1 text-sm text-zinc-500">Sign in to your applicant account</p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="applicant-username"
          className="block text-xs font-semibold uppercase tracking-widest text-zinc-500"
        >
          Username
        </label>
        <input
          id="applicant-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/40"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="applicant-password"
          className="block text-xs font-semibold uppercase tracking-widest text-zinc-500"
        >
          Password
        </label>
        <input
          id="applicant-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/40"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
          <svg className="h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#041018]/30 border-t-[#041018]" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>

      <p className="text-center text-xs text-zinc-700">
        Credentials from the <code className="text-zinc-600">applicants</code> table in Supabase.
      </p>
    </form>
  );
}
