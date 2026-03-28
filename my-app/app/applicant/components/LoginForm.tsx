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
      className="w-full max-w-md space-y-5 rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="text-center">
        <p className="text-lg font-semibold text-slate-900">Sign in</p>
        <p className="mt-1 text-sm text-slate-500">Applicant portal</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="applicant-username" className="block text-sm font-medium text-slate-700">
          Username
        </label>
        <input
          id="applicant-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="applicant-password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="applicant-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Signing in…
          </>
        ) : (
          "Continue"
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        Uses your <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-700">applicants</code> row
        in Supabase.
      </p>
    </form>
  );
}
