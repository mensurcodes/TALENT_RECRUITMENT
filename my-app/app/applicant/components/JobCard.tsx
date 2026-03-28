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
      className={`group flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.04] transition-all duration-300 ease-out ${
        applied
          ? "border-slate-200/90 opacity-[0.92]"
          : "border-slate-200/80 hover:-translate-y-1 hover:border-blue-200/80 hover:shadow-[0_20px_50px_-24px_rgba(37,99,235,0.22)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100/80">
          {employmentLabel(job.employment_type)}
        </span>
        {job.us_work_auth && (
          <span className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80">
            {job.us_work_auth}
          </span>
        )}
        {applied && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
            Applied
          </span>
        )}
      </div>

      <h2 className="mt-4 text-[17px] font-semibold leading-snug tracking-tight text-slate-900 transition-colors duration-200 group-hover:text-blue-700">
        {job.title}
      </h2>
      <p className="mt-1.5 text-sm text-slate-600">
        {job.company_name}
        <span className="mx-1.5 text-slate-300">·</span>
        <span className="text-slate-500">{job.recruiter_name}</span>
      </p>
      {job.description && (
        <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-slate-500">{job.description}</p>
      )}

      <div className="mt-auto flex flex-1 flex-col justify-end gap-2 pt-6 sm:flex-row sm:items-center">
        {applied ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/results`}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 sm:flex-initial"
            >
              Results
            </Link>
            <Link
              href={`/applicant/jobs/${job.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 sm:flex-initial"
            >
              Details
            </Link>
          </>
        ) : (
          <Link
            href={`/applicant/jobs/${job.id}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/30 sm:w-auto"
          >
            View role
            <span className="ml-1.5 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}
