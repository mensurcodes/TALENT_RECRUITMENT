import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600/90">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
        That URL does not exist, or the job may have been removed. Applicant pages use the{" "}
        <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-800">
          /applicant
        </code>{" "}
        prefix.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Home
        </Link>
        <Link
          href="/applicant"
          className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg"
        >
          Applicant sign in
        </Link>
        <Link
          href="/applicant/jobs"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Jobs
        </Link>
        <Link
          href="/recruiter"
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Recruiter
        </Link>
      </div>
    </div>
  );
}
