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
      ? "bg-blue-600 text-white"
      : pct >= 0.5
        ? "bg-blue-100 text-blue-900 ring-1 ring-blue-200"
        : "bg-slate-200 text-slate-800";
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {score}/{max ?? 100}
    </span>
  );
}

function ApplicationCard({ interview }: { interview: InterviewRow }) {
  const title = interview.job?.title ?? `Job #${interview.job_id}`;
  const company = interview.job?.company_name ?? "";
  const date = interview.submitted_at ?? interview.created_at;

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
            Submitted
          </span>
          <ScorePill score={interview.score} max={interview.max_score} />
        </div>
        <p className="mt-2 font-semibold text-slate-900">{title}</p>
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
          <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{interview.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/applicant/jobs/${interview.job_id}/results`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          View results
        </Link>
        <Link
          href={`/applicant/jobs/${interview.job_id}`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Job details
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
        <Link href="/applicant" className="text-sm font-medium text-blue-600 hover:text-blue-700">
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
    <div className="space-y-10">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Your opportunities
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{applicant.name}</span>
              <span className="mx-2 text-slate-300">·</span>
              {applicant.email}
              <span className="mx-2 text-slate-300">·</span>
              {pref === "unknown" ? "Any employment type" : pref.replaceAll("_", "-")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 ring-1 ring-blue-100">
              {interviews.length} application{interviews.length !== 1 ? "s" : ""}
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">
              {openJobs.length} open role{openJobs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {interviews.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">My applications</h2>
          <ul className="space-y-3">
            {interviews.map((interview) => (
              <li key={interview.id}>
                <ApplicationCard interview={interview} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Open roles</h2>
          {appliedJobs.length > 0 && (
            <span className="text-xs text-slate-500">({appliedJobs.length} already applied)</span>
          )}
        </div>

        {openJobs.length === 0 && jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
            No roles match your profile. Update your employment type or ask a recruiter to add jobs.
          </div>
        ) : openJobs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
            You&apos;ve applied to all matched roles.
          </div>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {openJobs.map((job) => (
              <li key={job.id} className="min-h-[260px]">
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}

        {appliedJobs.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
              Previously applied ({appliedJobs.length})
            </summary>
            <ul className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
