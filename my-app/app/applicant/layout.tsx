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
    <div className="applicant-pitch min-h-dvh w-full bg-gradient-to-br from-amber-50 via-lime-50 to-emerald-100 text-emerald-950">
      <header className="sticky top-0 z-50 w-full border-b border-emerald-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:h-[4.25rem] sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <Link
              href={sessionId ? "/applicant/jobs" : "/applicant"}
              className="flex items-center gap-2.5 text-base font-bold tracking-tight text-emerald-900"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-400 to-lime-500 text-sm font-black text-emerald-950 shadow-md ring-2 ring-white">
                T
              </span>
              <span className="hidden sm:inline">Talent</span>
            </Link>
            {sessionId && (
              <>
                <span className="text-emerald-300">/</span>
                <span className="text-sm font-medium text-emerald-700">Applicant</span>
              </>
            )}
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {sessionId ? (
              <>
                <Link
                  href="/applicant/jobs"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-lime-100"
                >
                  Job board
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/applicant"
                className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="w-full px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">{children}</main>
    </div>
  );
}
