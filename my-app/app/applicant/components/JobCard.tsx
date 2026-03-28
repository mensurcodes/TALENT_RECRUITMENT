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
  appliedInterviewId?: number;
};

export function JobCard({ job, appliedInterviewId }: Props) {
  const applied = appliedInterviewId !== undefined;

  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-white p-5 shadow-sm transition ${
        applied ? "border-slate-200 opacity-90" : "border-slate-200 hover:border-blue-200 hover:shadow-md"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-100">
          {employmentLabel(job.employment_type)}
        </span>
        {job.us_work_auth && (
          <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
            {job.us_work_auth}
          </span>
        )}
        {applied && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            Applied
          </span>
        )}
      </div>

      <h2 className="mt-3 text-base font-semibold text-slate-900">{job.title}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {job.company_name}
        <span className="mx-1.5 text-slate-300">·</span>
        {job.recruiter_name}
      </p>
      {job.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{job.description}</p>
      )}

      <div className="mt-auto flex flex-1 flex-col justify-end gap-2 pt-5 sm:flex-row sm:items-center">
        {applied ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/results`}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:flex-initial"
            >
              Results
            </Link>
            <Link
              href={`/applicant/jobs/${job.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex-initial"
            >
              Details
            </Link>
          </>
        ) : (
          <Link
            href={`/applicant/jobs/${job.id}`}
            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            View role
          </Link>
        )}
      </div>
    </article>
  );
}
