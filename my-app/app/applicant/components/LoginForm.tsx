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
      className="w-full max-w-md space-y-5 rounded-3xl border-2 border-emerald-200 bg-white p-8 shadow-2xl shadow-emerald-900/10 ring-4 ring-lime-100"
    >
      <div className="text-center">
        <p className="text-xl font-bold text-emerald-950">Welcome back</p>
        <p className="mt-1 text-sm font-medium text-emerald-700">Applicant sign-in</p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="applicant-username"
          className="block text-xs font-bold uppercase tracking-widest text-emerald-700"
        >
          Username
        </label>
        <input
          id="applicant-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-xl border-2 border-emerald-100 bg-lime-50/50 px-4 py-3 text-emerald-950 outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-300"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="applicant-password"
          className="block text-xs font-bold uppercase tracking-widest text-emerald-700"
        >
          Password
        </label>
        <input
          id="applicant-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border-2 border-emerald-100 bg-lime-50/50 px-4 py-3 text-emerald-950 outline-none transition focus:border-lime-500 focus:ring-2 focus:ring-lime-300"
        />
      </div>

      {error && (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 py-3.5 text-base font-bold text-white shadow-lg transition hover:from-emerald-700 hover:to-lime-700 disabled:opacity-60"
      >
        {pending ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Signing in…
          </>
        ) : (
          "Continue →"
        )}
      </button>

      <p className="text-center text-xs font-medium text-emerald-600">
        Demo: credentials from your <code className="rounded bg-lime-100 px-1">applicants</code> table.
      </p>
    </form>
  );
}
