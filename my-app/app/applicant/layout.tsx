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
    <div className="applicant-hub relative min-h-dvh w-full bg-white text-slate-900 antialiased">
      {/* Ambient blue fields — brand-only color */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="applicant-blob absolute -left-[20%] -top-[10%] h-[min(42rem,90vw)] w-[min(42rem,90vw)] rounded-full bg-blue-500/[0.09] blur-3xl" />
        <div className="applicant-blob-delay absolute -right-[15%] top-[25%] h-[min(36rem,80vw)] w-[min(36rem,80vw)] rounded-full bg-blue-600/[0.06] blur-3xl" />
        <div className="applicant-blob absolute bottom-[-20%] left-[30%] h-[min(32rem,70vw)] w-[min(32rem,70vw)] rounded-full bg-blue-400/[0.05] blur-3xl [animation-delay:-12s]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-[3.75rem] w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={sessionId ? "/applicant/jobs" : "/applicant"}
              className="group flex items-center gap-3 transition-opacity hover:opacity-90"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-[1.03]">
                T
              </span>
              <span className="hidden text-[15px] font-semibold tracking-[-0.02em] text-slate-900 sm:inline">
                Talent
              </span>
            </Link>
            {sessionId && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-[13px] font-medium tracking-wide text-slate-500">Applicants</span>
              </>
            )}
          </div>
          <nav className="flex items-center gap-1">
            {sessionId ? (
              <>
                <Link
                  href="/applicant/jobs"
                  className="rounded-full px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
                >
                  Jobs
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/applicant"
                className="rounded-full bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white shadow-md shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  );
}
