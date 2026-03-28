import Link from "next/link";
import { fetchApplicant, fetchQualifiedJobs } from "../actions";
import { hasSupabaseConfig } from "../lib/supabase";
import { normalizeEmployment } from "../lib/employment";
import { JobCard } from "../components/JobCard";
import { SupabaseNotice } from "../components/SupabaseNotice";
import { requireApplicantSession } from "../lib/auth";

export default function RecruiterJobsPage() {
  // assume jobs is already fetched above

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Jobs
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Manage your active roles and review candidates.
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-400">
          No jobs yet. Create your first job to get started.
        </div>
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex flex-col gap-3">
                {/* Top section */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-white">
                      {job.title}
                    </span>

                    <span className="text-xs text-zinc-400">
                      {job.company_name} • {job.recruiter_name}
                    </span>

                    {job.employment_type && (
                      <span className="text-xs text-zinc-300">
                        {job.employment_type}
                      </span>
                    )}
                  </div>

                  <a
                    href={`/recruiter/jobs/${job.id}`}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    View
                  </a>
                </div>

                {/* Description */}
                {job.description && (
                  <p className="text-xs text-zinc-400 line-clamp-3">
                    {job.description}
                  </p>
                )}

                {/* Actions row */}
                <div className="flex items-center gap-4 pt-2 text-xs">
                  <a
                    href={`/recruiter/jobs/${job.id}/edit`}
                    className="text-zinc-400 hover:text-white"
                  >
                    Edit
                  </a>

                  <a
                    href={`/recruiter/jobs/${job.id}/candidates`}
                    className="text-zinc-400 hover:text-white"
                  >
                    Candidates
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
