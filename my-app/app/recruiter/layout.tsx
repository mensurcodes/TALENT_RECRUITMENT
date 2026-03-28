import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";
import { LogoutButton } from "./components/LogoutButton";
import { getRecruiterSessionId } from "./lib/auth";

export const metadata: Metadata = {
  title: "Recruiter portal",
  description: "Manage jobs and review candidates.",
};

export default async function RecruiterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sessionId = await getRecruiterSessionId();

  return (
    <div className="min-h-full bg-[#070b14] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href={sessionId ? "/" : "/recruiter"}
            className="text-sm font-semibold tracking-tight text-white sm:text-base"
          >
            Recruiter
          </Link>

          <nav className="flex items-center gap-4 text-sm text-zinc-400">
            {sessionId ? (
              <>
                <LogoutButton />
              </>
            ) : (
              <Link href="/recruiter" className="transition hover:text-white">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
