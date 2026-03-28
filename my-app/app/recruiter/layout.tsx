import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import { getRecruiterSessionId } from "./lib/auth";
import { LogoutButton } from "./components/LogoutButton";

export const metadata: Metadata = {
  title: "Talent — Recruiter",
  description: "Review applicants and assessment reports.",
};

export default async function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const sessionId = await getRecruiterSessionId();

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={sessionId ? "/recruiter/dashboard" : "/recruiter"}
              className="group flex items-center gap-2"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-500/20">
                R
              </span>
              <span className="text-[15px] font-semibold text-slate-900">Recruiter</span>
            </Link>
          </div>
          <nav className="flex items-center gap-2">
            {sessionId ? (
              <>
                <Link
                  href="/recruiter/dashboard"
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-100"
                >
                  Dashboard
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link href="/recruiter" className="text-sm text-slate-600 hover:text-slate-900">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
