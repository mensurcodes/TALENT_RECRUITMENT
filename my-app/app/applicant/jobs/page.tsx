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
      ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
      : pct >= 0.5
        ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
        : "bg-rose-500/10 text-rose-400 ring-rose-500/20";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {score}/{max ?? 100}
    </span>
  );
}

function ApplicationCard({ interview }: { interview: InterviewRow }) {
  const title = interview.job?.title ?? `Job #${interview.job_id}`;
  const company = interview.job?.company_name ?? "";
  const date = interview.submitted_at ?? interview.created_at;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
            Submitted
          </span>
          <ScorePill score={interview.score} max={interview.max_score} />
        </div>
        <p className="mt-2 font-medium text-white">{title}</p>
        <p className="mt-0.5 text-sm text-zinc-400">
          {company}
          {date && (
            <>
              <span className="mx-2 text-zinc-700">·</span>
              <span className="text-zinc-600">
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
          <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500">{interview.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/applicant/jobs/${interview.job_id}/results`}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
        >
          View results
        </Link>
        <Link
          href={`/applicant/jobs/${interview.job_id}`}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
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
        <Link href="/applicant" className="text-sm text-cyan-400 hover:text-cyan-300">
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
      <p className="text-sm text-zinc-400">
        Session invalid.{" "}
        <Link href="/applicant" className="text-cyan-400 hover:text-cyan-300">
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
    <div className="space-y-12">
      {/* Page header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Your job board
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Signed in as{" "}
            <span className="font-medium text-zinc-200">{applicant.name}</span>
            <span className="mx-1.5 text-zinc-700">·</span>
            <span className="text-zinc-500">{applicant.email}</span>
            <span className="mx-1.5 text-zinc-700">·</span>
            <span className="text-zinc-400">
              {pref === "unknown" ? "Any employment type" : pref.replaceAll("_", "-")}
            </span>
          </p>
        </div>
        <div className="flex gap-3 text-xs text-zinc-500">
          <span className="rounded-lg border border-white/10 px-3 py-1.5">
            {interviews.length} application{interviews.length !== 1 ? "s" : ""}
          </span>
          <span className="rounded-lg border border-white/10 px-3 py-1.5">
            {openJobs.length} open role{openJobs.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* My Applications */}
      {interviews.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            My applications
          </h2>
          <ul className="space-y-3">
            {interviews.map((interview) => (
              <li key={interview.id}>
                <ApplicationCard interview={interview} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Open roles */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          <span className="inline-block h-2 w-2 rounded-full bg-cyan-500" />
          Open roles matched to you
          {appliedJobs.length > 0 && (
            <span className="ml-auto text-xs font-normal normal-case text-zinc-600">
              {appliedJobs.length} already applied
            </span>
          )}
        </h2>

        {openJobs.length === 0 && jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
            No open roles match your employment type. Try updating your preference in Supabase or
            ask a recruiter to post matching jobs.
          </div>
        ) : openJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-zinc-500">
            You&apos;ve applied to all matched roles.
          </div>
        ) : (
          <ul className="grid gap-5 lg:grid-cols-2">
            {openJobs.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}

        {/* Already applied jobs — shown collapsed */}
        {appliedJobs.length > 0 && (
          <details className="group mt-2">
            <summary className="cursor-pointer list-none text-xs text-zinc-600 hover:text-zinc-400">
              Show {appliedJobs.length} already-applied role{appliedJobs.length !== 1 ? "s" : ""} ›
            </summary>
            <ul className="mt-4 grid gap-5 lg:grid-cols-2">
              {appliedJobs.map((job) => {
                const match = interviews.find((i) => i.job_id === job.id);
                return (
                  <li key={job.id}>
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
