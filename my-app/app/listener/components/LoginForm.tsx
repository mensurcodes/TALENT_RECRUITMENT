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
    router.push("/listener/jobs");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
      <div className="space-y-2">
        <label htmlFor="listener-username" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Username
        </label>
        <input
          id="listener-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-cyan-500/40 focus:ring-2"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="listener-password" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Password
        </label>
        <input
          id="listener-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-cyan-500/40 focus:ring-2"
        />
      </div>
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-cyan-500 py-2.5 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-xs text-zinc-600">
        Uses your row in <code className="text-zinc-500">applicants</code> (username + password).
      </p>
    </form>
  );
}
