import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

export const metadata: Metadata = {
  title: "Listener — Applicant portal",
  description: "Matched roles, applications, and assessments.",
};

export default function ListenerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="listener-root min-h-full bg-[#070b14] text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b14]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/listener"
            className="text-sm font-semibold tracking-tight text-white sm:text-base"
          >
            Listener
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-400">
            <Link href="/listener" className="transition hover:text-white">
              Portal home
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
