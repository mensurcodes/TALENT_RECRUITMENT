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
      className={`group flex h-full flex-col rounded-3xl border-2 bg-white p-6 shadow-lg transition ${
        applied
          ? "border-emerald-200 opacity-95"
          : "border-lime-200 hover:border-lime-400 hover:shadow-xl"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-gradient-to-r from-yellow-300 to-lime-300 px-3 py-1 text-xs font-bold text-emerald-950">
          {employmentLabel(job.employment_type)}
        </span>
        {job.us_work_auth && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
            {job.us_work_auth}
          </span>
        )}
        {applied && (
          <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
            Applied
          </span>
        )}
      </div>

      <h2 className="mt-4 text-lg font-bold text-emerald-950">{job.title}</h2>
      <p className="mt-1 text-sm font-semibold text-emerald-800">
        {job.company_name}
        <span className="mx-2 font-normal text-emerald-400">·</span>
        <span className="font-medium text-emerald-600">{job.recruiter_name}</span>
      </p>
      {job.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-emerald-800/80">{job.description}</p>
      )}

      <div className="mt-auto flex flex-1 flex-col justify-end gap-2 pt-6 sm:flex-row sm:items-center">
        {applied ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/results`}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-emerald-700 hover:to-lime-700 sm:flex-initial"
            >
              View results
            </Link>
            <Link
              href={`/applicant/jobs/${job.id}`}
              className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-emerald-200 bg-white px-4 py-2.5 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 sm:flex-initial"
            >
              Details
            </Link>
          </>
        ) : (
          <Link
            href={`/applicant/jobs/${job.id}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-yellow-400 to-lime-500 px-4 py-3 text-sm font-black text-emerald-950 shadow-md transition hover:brightness-105 sm:w-auto"
          >
            View role →
          </Link>
        )}
      </div>
    </article>
  );
}
