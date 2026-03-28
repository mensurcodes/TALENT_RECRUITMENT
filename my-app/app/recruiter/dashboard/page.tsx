import Link from "next/link";
import { fetchJobsForRecruiter, fetchRecruiter } from "../actions";
import { hasSupabaseConfig } from "../../applicant/lib/supabase";
import { SupabaseNotice } from "../../applicant/components/SupabaseNotice";
import { requireRecruiterSession } from "../lib/auth";

export default async function RecruiterDashboardPage() {
  const recruiterId = await requireRecruiterSession();

  if (!hasSupabaseConfig()) {
    return (
      <div>
        <SupabaseNotice />
      </div>
    );
  }

  const [recruiter, jobs] = await Promise.all([fetchRecruiter(recruiterId), fetchJobsForRecruiter(recruiterId)]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600/90">Dashboard</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Your postings</h1>
        <p className="mt-1 text-sm text-slate-600">
          {recruiter?.company_name ?? "Company"} — open a role to see applicants and PDFs.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-600">
          No jobs found for this recruiter account. Seed data includes jobs for{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">recruiter_stripe</code>,{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">recruiter_openai</code>,{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">recruiter_vercel</code>.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/recruiter/jobs/${job.id}`}
                className="block rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{job.company_name}</p>
                <p className="mt-1 font-semibold text-slate-900">{job.title}</p>
                <p className="mt-2 text-sm text-emerald-700">View applicants →</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
