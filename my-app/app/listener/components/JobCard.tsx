import Link from "next/link";
import type { JobRow } from "../types";
import { normalizeEmployment } from "../lib/employment";

function badge(type: string | null | undefined) {
  const b = normalizeEmployment(type);
  if (b === "internship") return "Internship";
  if (b === "full_time") return "Full-time";
  return type?.trim() || "Role";
}

export function JobCard({ job }: { job: JobRow }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-cyan-500/30 hover:bg-white/[0.05]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-200">
          {badge(job.employment_type)}
        </span>
        {job.us_work_auth ? (
          <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-400">
            {job.us_work_auth}
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 text-lg font-semibold tracking-tight text-white group-hover:text-cyan-100">
        {job.title}
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        {job.company_name}
        <span className="text-zinc-600"> · </span>
        <span className="text-zinc-500">Posted by {job.recruiter_name}</span>
      </p>
      {job.description ? (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-400">{job.description}</p>
      ) : null}
      <div className="mt-5 flex flex-1 flex-col justify-end gap-3 sm:flex-row sm:items-center">
        <Link
          href={`/listener/jobs/${job.id}`}
          className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400"
        >
          View & apply
        </Link>
      </div>
    </article>
  );
}
