import Link from "next/link";
import { fetchApplicant, fetchQualifiedJobs } from "../actions";
import { hasSupabaseConfig } from "../lib/supabase";
import { normalizeEmployment } from "../lib/employment";
import { JobCard } from "../components/JobCard";
import { SupabaseNotice } from "../components/SupabaseNotice";
import { requireApplicantSession } from "../lib/auth";

export default async function ApplicantJobsPage() {
  const applicantId = await requireApplicantSession();

  if (!hasSupabaseConfig()) {
    return (
      <div className="space-y-6">
        <SupabaseNotice />
        <Link href="/applicant" className="text-sm text-cyan-400 hover:text-cyan-300">
          ← Back
        </Link>
      </div>
    );
  }

  const applicant = await fetchApplicant(applicantId);
  if (!applicant) {
    return (
      <p className="text-sm text-zinc-400">
        Session invalid. <Link href="/applicant">Sign in again</Link>.
      </p>
    );
  }

  const jobs = await fetchQualifiedJobs(applicantId);
  const pref = normalizeEmployment(applicant.employment_type);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">Matched jobs</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Signed in as{" "}
            <span className="text-zinc-200">
              {applicant.name} ({applicant.email})
            </span>
            <span className="text-zinc-600"> · </span>
            Preference:{" "}
            <span className="text-zinc-200">
              {pref === "unknown" ? "Any / unspecified" : pref.replaceAll("_", "-")}
            </span>
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-400">
          No open roles match your employment type filter. Try updating{" "}
          <code className="text-zinc-200">applicants.employment_type</code> in Supabase or add jobs.
        </div>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
