import Link from "next/link";
import type { JobRow } from "../types";
import { normalizeEmployment } from "../lib/employment";

function employmentLabel(type: string | null | undefined) {
  const b = normalizeEmployment(type);
  if (b === "internship") return "Internship";
  if (b === "full_time") return "Full-time";
  return type?.trim() || "Role";
}

type Props = {
  job: JobRow;
  /** If provided, the applicant has already applied; this is the interview id for linking to results. */
  appliedInterviewId?: number;
};

export function JobCard({ job, appliedInterviewId }: Props) {
  const applied = appliedInterviewId !== undefined;

  return (
    <article
      className={`group flex flex-col rounded-2xl border bg-white/[0.03] p-5 shadow-sm transition ${
        applied
          ? "border-white/5 opacity-60"
          : "border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-200">
          {employmentLabel(job.employment_type)}
        </span>
        {job.us_work_auth && (
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
            {job.us_work_auth}
          </span>
        )}
        {applied && (
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
            Applied
          </span>
        )}
      </div>

      <h2
        className={`mt-3 text-base font-semibold tracking-tight text-white ${!applied ? "group-hover:text-cyan-100" : ""}`}
      >
        {job.title}
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        {job.company_name}
        <span className="mx-1.5 text-zinc-700">·</span>
        <span className="text-zinc-500">{job.recruiter_name}</span>
      </p>
      {job.description && (
        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-zinc-500">
          {job.description}
        </p>
      )}

      <div className="mt-5 flex flex-1 flex-col justify-end gap-2 sm:flex-row sm:items-center">
        {applied ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/results`}
              className="inline-flex items-center justify-center rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10"
            >
              View results
            </Link>
            <Link
              href={`/applicant/jobs/${job.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
            >
              Details
            </Link>
          </>
        ) : (
          <Link
            href={`/applicant/jobs/${job.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400"
          >
            View & apply
          </Link>
        )}
      </div>
    </article>
  );
}
