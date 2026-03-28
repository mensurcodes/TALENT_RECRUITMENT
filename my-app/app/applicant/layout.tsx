import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import { LogoutButton } from "./components/LogoutButton";
import { getApplicantSessionId } from "./lib/auth";

export const metadata: Metadata = {
  title: "Talent — Applicant",
  description: "Matched roles, applications, and AI assessments.",
};

export default async function ApplicantLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessionId = await getApplicantSessionId();

  return (
    <div className="min-h-dvh w-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href={sessionId ? "/applicant/jobs" : "/applicant"}
              className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 sm:text-base"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                T
              </span>
              <span className="hidden sm:inline">Talent</span>
            </Link>
            {sessionId && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-sm text-slate-600">Applicant</span>
              </>
            )}
          </div>
          <nav className="flex items-center gap-2">
            {sessionId ? (
              <>
                <Link
                  href="/applicant/jobs"
                  className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Jobs
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/applicant"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">{children}</main>
    </div>
  );
}
