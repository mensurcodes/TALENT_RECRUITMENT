import Link from "next/link";
import { fetchApplicant, fetchQualifiedJobs, fetchMyInterviews } from "../actions";
import { hasSupabaseConfig } from "../lib/supabase";
import { normalizeEmployment } from "../lib/employment";
import { JobCard } from "../components/JobCard";
import { SupabaseNotice } from "../components/SupabaseNotice";
import { requireApplicantSession } from "../lib/auth";
import type { InterviewRow } from "../types";

function ScorePill({ score, max }: { score: number | null; max: number | null }) {
  if (score === null) return null;
  const pct = (max ?? 100) > 0 ? score / (max ?? 100) : 0;
  const cls =
    pct >= 0.75
      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
      : pct >= 0.5
        ? "bg-blue-100 text-blue-900 ring-1 ring-blue-200/80"
        : "bg-slate-200 text-slate-800";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {score}/{max ?? 100}
    </span>
  );
}

function ApplicationCard({ interview }: { interview: InterviewRow }) {
  const title = interview.job?.title ?? `Job #${interview.job_id}`;
  const company = interview.job?.company_name ?? "";
  const date = interview.submitted_at ?? interview.created_at;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-blue-200/60 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
            Submitted
          </span>
          <ScorePill score={interview.score} max={interview.max_score} />
        </div>
        <p className="mt-2 text-base font-semibold tracking-tight text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-600">
          {company}
          {date && (
            <>
              <span className="mx-2 text-slate-300">·</span>
              <span className="text-slate-500">
                {new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </>
          )}
        </p>
        {interview.summary && (
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-500">{interview.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/applicant/jobs/${interview.job_id}/results`}
          className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg"
        >
          Results
        </Link>
        <Link
          href={`/applicant/jobs/${interview.job_id}`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
        >
          Job
        </Link>
      </div>
    </article>
  );
}

export default async function ApplicantJobsPage() {
  const applicantId = await requireApplicantSession();

  if (!hasSupabaseConfig()) {
    return (
      <div className="space-y-6">
        <SupabaseNotice />
        <Link href="/applicant" className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
          ← Back
        </Link>
      </div>
    );
  }

  const [applicant, interviews] = await Promise.all([
    fetchApplicant(applicantId),
    fetchMyInterviews(applicantId),
  ]);

  if (!applicant) {
    return (
      <p className="text-sm text-slate-600">
        Session invalid.{" "}
        <Link href="/applicant" className="font-medium text-blue-600 hover:text-blue-700">
          Sign in again
        </Link>
        .
      </p>
    );
  }

  const jobs = await fetchQualifiedJobs(applicantId);
  const pref = normalizeEmployment(applicant.employment_type);

  const appliedJobIds = new Set(interviews.map((i) => i.job_id));
  const openJobs = jobs.filter((j) => !appliedJobIds.has(j.id));
  const appliedJobs = jobs.filter((j) => appliedJobIds.has(j.id));

  return (
    <div className="space-y-14">
      <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-8 shadow-[0_20px_60px_-28px_rgba(37,99,235,0.15)] ring-1 ring-slate-900/[0.04] backdrop-blur-md sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600/90">Your pipeline</p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">Opportunities</h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600">
              <span className="font-medium text-slate-900">{applicant.name}</span>
              <span className="mx-2 text-slate-300">·</span>
              {applicant.email}
              <span className="mx-2 text-slate-300">·</span>
              {pref === "unknown" ? "Any employment type" : pref.replaceAll("_", "-")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-4 py-2 text-[13px] font-medium text-blue-800 ring-1 ring-blue-100/80">
              {interviews.length} application{interviews.length !== 1 ? "s" : ""}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700">
              {openJobs.length} open
            </span>
          </div>
        </div>
      </div>

      {interviews.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500">Applications</h2>
          <ul className="applicant-stagger space-y-3">
            {interviews.map((interview) => (
              <li key={interview.id}>
                <ApplicationCard interview={interview} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500">Open roles</h2>
          {appliedJobs.length > 0 && (
            <span className="text-xs text-slate-500">{appliedJobs.length} already applied</span>
          )}
        </div>

        {openJobs.length === 0 && jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 text-center text-sm text-slate-600">
            No roles match your profile yet.
          </div>
        ) : openJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-12 text-center text-sm text-slate-600">
            You&apos;ve applied to all matched roles.
          </div>
        ) : (
          <ul className="applicant-stagger grid gap-5 md:grid-cols-2">
            {openJobs.map((job) => (
              <li key={job.id} className="min-h-[260px]">
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}

        {appliedJobs.length > 0 && (
          <details className="group pt-2">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 transition-colors hover:text-blue-700">
              Previously applied ({appliedJobs.length})
            </summary>
            <ul className="applicant-stagger mt-5 grid gap-5 md:grid-cols-2">
              {appliedJobs.map((job) => {
                const match = interviews.find((i) => i.job_id === job.id);
                return (
                  <li key={job.id} className="min-h-[260px]">
                    <JobCard job={job} appliedInterviewId={match?.id} />
                  </li>
                );
              })}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
