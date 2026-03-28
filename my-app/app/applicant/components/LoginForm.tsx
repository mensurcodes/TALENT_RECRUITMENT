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
      className="space-y-6 rounded-3xl border border-slate-200/90 bg-white/80 p-8 shadow-[0_24px_80px_-20px_rgba(37,99,235,0.12)] ring-1 ring-slate-900/[0.04] backdrop-blur-sm"
    >
      <div className="text-center">
        <p className="text-lg font-semibold tracking-tight text-slate-900">Welcome back</p>
        <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="applicant-username" className="block text-[13px] font-medium text-slate-700">
          Username
        </label>
        <input
          id="applicant-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow duration-200 placeholder:text-slate-400 focus:border-blue-500/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="applicant-password" className="block text-[13px] font-medium text-slate-700">
          Password
        </label>
        <input
          id="applicant-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow duration-200 placeholder:text-slate-400 focus:border-blue-500/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800 transition-all duration-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 py-3 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.99] disabled:opacity-50"
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

      <p className="text-center text-xs leading-relaxed text-slate-500">
        Demo credentials from your{" "}
        <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
          applicants
        </code>{" "}
        table.
      </p>
    </form>
  );
}
