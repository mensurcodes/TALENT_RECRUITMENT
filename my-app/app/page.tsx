import Link from "next/link";

const steps = [
  { title: "Sign in", desc: "Supabase applicant account" },
  { title: "Browse", desc: "Jobs matched to your role type" },
  { title: "Apply", desc: "Resume + GitHub context" },
  { title: "Interview", desc: "Timed video answers" },
  { title: "Results", desc: "Rubric-based feedback" },
];

export default function Home() {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#030712] text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(34,211,238,0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(59,130,246,0.08),transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(3,7,18,0.4)_50%,#030712_100%)]" />

      <main className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
        <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300/90">
          Talent recruitment
        </div>

        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl sm:leading-[1.05] lg:text-6xl">
          Hire and apply with{" "}
          <span className="bg-linear-to-r from-cyan-300 to-teal-200 bg-clip-text text-transparent">
            matched roles
          </span>{" "}
          & smart assessments.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
          Candidates sign in, see jobs that fit their profile, submit resume and
          GitHub links, then complete a timed video interview transcribed and
          scored against each posting&apos;s rubric.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-stretch">
          <Link
            href="/applicant"
            className="group relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-cyan-500/30 bg-linear-to-br from-cyan-500/20 to-cyan-600/5 px-8 py-6 shadow-[0_0_40px_-12px_rgba(34,211,238,0.45)] transition hover:border-cyan-400/50 hover:shadow-[0_0_48px_-8px_rgba(34,211,238,0.55)] sm:max-w-sm"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">
              For candidates
            </span>
            <span className="mt-2 text-xl font-semibold text-white">
              Applicant portal
            </span>
            <span className="mt-2 text-sm leading-relaxed text-zinc-300">
              Log in, apply, and complete your assessment.
            </span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan-300 group-hover:gap-2">
              Continue <span aria-hidden>→</span>
            </span>
          </Link>

          <Link
            href="/recruiter"
            className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-white/4 px-8 py-6 transition hover:border-white/20 hover:bg-white/7 sm:max-w-sm"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              For hiring teams
            </span>
            <span className="mt-2 text-xl font-semibold text-white">
              Recruiter
            </span>
            <span className="mt-2 text-sm leading-relaxed text-zinc-400">
              Post roles and rubrics (partner flow).
            </span>
            <span className="mt-4 text-sm font-medium text-zinc-300">
              Open →
            </span>
          </Link>
        </div>

        <section
          className="mt-16 border-t border-white/10 pt-12"
          aria-labelledby="flow-heading"
        >
          <h2
            id="flow-heading"
            className="text-sm font-semibold uppercase tracking-wider text-zinc-500"
          >
            Applicant flow
          </h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-5">
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="relative rounded-xl border border-white/5 bg-white/3 px-4 py-4"
              >
                <span className="font-mono text-xs text-cyan-500/80">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-1 font-medium text-white">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {s.desc}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
