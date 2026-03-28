import Link from "next/link";
import { fetchApplicantSummaries } from "./actions";
import { hasSupabaseConfig } from "./lib/supabase";
import { SupabaseNotice } from "./components/SupabaseNotice";

export default async function ListenerHomePage() {
  const ok = hasSupabaseConfig();
  const applicants = ok ? await fetchApplicantSummaries() : [];

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
          Applicant portal
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Roles matched to your profile
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
          Choose your applicant record to see jobs that align with your{" "}
          <span className="text-zinc-200">full-time</span> or{" "}
          <span className="text-zinc-200">internship</span> preference, then apply with your resume
          and GitHub. Assessments are timed like HackerRank: prep, then answer — grounded in your
          materials and the posting.
        </p>
      </section>

      {!ok ? (
        <SupabaseNotice />
      ) : applicants.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
          No applicants in Supabase yet. Insert rows into the{" "}
          <code className="text-zinc-200">applicants</code> table, then refresh.
        </p>
      ) : (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Continue as</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {applicants.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/listener/jobs?applicantId=${a.id}`}
                  className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 transition hover:border-cyan-500/40 hover:bg-white/[0.06]"
                >
                  <span className="font-medium text-white">{a.name}</span>
                  <span className="text-sm text-zinc-500">{a.email}</span>
                  <span className="mt-2 text-xs text-cyan-300/80">Open matched jobs →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
