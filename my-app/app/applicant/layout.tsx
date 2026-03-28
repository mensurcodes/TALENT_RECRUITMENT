import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import { LogoutButton } from "./components/LogoutButton";
import { getApplicantSessionId } from "./lib/auth";

export const metadata: Metadata = {
  title: "Applicant portal",
  description: "Matched roles, applications, and assessments.",
};

export default async function ApplicantLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessionId = await getApplicantSessionId();

  return (
    <div className="min-h-screen bg-[#060a13] text-zinc-100">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#060a13]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={sessionId ? "/applicant/jobs" : "/applicant"}
              className="flex items-center gap-2 text-sm font-semibold text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500 text-[10px] font-black text-[#041018]">
                T
              </span>
              Talent
            </Link>
            {sessionId && (
              <>
                <span className="text-zinc-800">/</span>
                <span className="text-sm text-zinc-500">Applicant portal</span>
              </>
            )}
          </div>
          <nav className="flex items-center gap-1">
            {sessionId ? (
              <>
                <Link
                  href="/applicant/jobs"
                  className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  Job board
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/applicant"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
