import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-[#070b14] dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400/90">
          Talent recruitment
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Hire and apply with matched roles & assessments.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          Applicants sign in, browse jobs that fit their profile, apply with resume and GitHub, and
          complete a timed video assessment scored against each role&apos;s rubric.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/applicant"
            className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400"
          >
            Applicant portal
          </Link>
          <Link
            href="/recruiter"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-white/20 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            Recruiter
          </Link>
        </div>
        <p className="mt-12 text-sm text-zinc-500 dark:text-zinc-600">
          Tip: open <span className="font-mono text-zinc-700 dark:text-zinc-400">/applicant</span> for
          login → jobs → apply → assessment → results.
        </p>
      </main>
    </div>
  );
}
