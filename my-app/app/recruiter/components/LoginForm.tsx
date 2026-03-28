"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginRecruiter } from "../actions";

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
    const r = await loginRecruiter(username, password);
    setPending(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    router.push("/recruiter/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-3xl border border-slate-200/90 bg-white/90 p-8 shadow-lg ring-1 ring-slate-900/[0.04]"
    >
      <div className="text-center">
        <p className="text-lg font-semibold tracking-tight text-slate-900">Recruiter sign in</p>
        <p className="mt-1 text-sm text-slate-500">Review applicants and download assessment PDFs</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="rec-username" className="block text-[13px] font-medium text-slate-700">
          Username
        </label>
        <input
          id="rec-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow focus:border-emerald-500/80 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="rec-password" className="block text-[13px] font-medium text-slate-700">
          Password
        </label>
        <input
          id="rec-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow focus:border-emerald-500/80 focus:shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 py-3 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Continue"}
      </button>

      <p className="text-center text-xs text-slate-500">
        Demo: <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">recruiter_stripe</code> /{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px]">demo1234</code>
      </p>
    </form>
  );
}
