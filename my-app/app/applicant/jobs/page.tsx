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
      ? "bg-emerald-600 text-white"
      : pct >= 0.5
        ? "bg-yellow-400 text-emerald-950"
        : "bg-orange-500 text-white";
  return (
    <span className={`rounded-full px-3 py-0.5 text-xs font-black shadow ${cls}`}>
      {score}/{max ?? 100}
    </span>
  );
}

function ApplicationCard({ interview }: { interview: InterviewRow }) {
  const title = interview.job?.title ?? `Job #${interview.job_id}`;
  const company = interview.job?.company_name ?? "";
  const date = interview.submitted_at ?? interview.created_at;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-lime-300 px-3 py-0.5 text-xs font-black text-emerald-950">
            Submitted
          </span>
          <ScorePill score={interview.score} max={interview.max_score} />
        </div>
        <p className="mt-2 text-lg font-bold text-emerald-950">{title}</p>
        <p className="mt-0.5 text-sm font-semibold text-emerald-800">
          {company}
          {date && (
            <>
              <span className="mx-2 text-emerald-300">·</span>
              <span className="font-medium text-emerald-600">
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
          <p className="mt-2 line-clamp-2 text-sm text-emerald-800/80">{interview.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/applicant/jobs/${interview.job_id}/results`}
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 px-4 py-2 text-xs font-bold text-white shadow-md"
        >
          View results
        </Link>
        <Link
          href={`/applicant/jobs/${interview.job_id}`}
          className="rounded-xl border-2 border-emerald-200 bg-white px-4 py-2 text-xs font-bold text-emerald-800"
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
        <Link href="/applicant" className="text-sm font-bold text-emerald-800 underline">
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
      <p className="text-sm font-medium text-emerald-800">
        Session invalid.{" "}
        <Link href="/applicant" className="font-bold text-lime-700 underline">
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
    <div className="mx-auto w-full max-w-7xl space-y-12">
      <div className="rounded-3xl border-2 border-white bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-700">Your dashboard</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Matched opportunities
            </h1>
            <p className="mt-2 text-base font-medium text-emerald-800">
              <span className="font-bold text-emerald-950">{applicant.name}</span>
              <span className="mx-2 text-emerald-300">·</span>
              {applicant.email}
              <span className="mx-2 text-emerald-300">·</span>
              {pref === "unknown" ? "Any employment type" : pref.replaceAll("_", "-")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-2xl bg-gradient-to-r from-yellow-300 to-lime-300 px-4 py-2 text-sm font-black text-emerald-950 shadow">
              {interviews.length} application{interviews.length !== 1 ? "s" : ""}
            </span>
            <span className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-900">
              {openJobs.length} open role{openJobs.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {interviews.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-3 text-lg font-black text-emerald-950">
            <span className="h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-lime-200" />
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

      <section className="space-y-4">
        <h2 className="flex flex-wrap items-center gap-3 text-lg font-black text-emerald-950">
          <span className="h-3 w-3 rounded-full bg-yellow-400 ring-4 ring-yellow-100" />
          Open roles for you
          {appliedJobs.length > 0 && (
            <span className="ml-auto text-sm font-bold text-emerald-600">
              {appliedJobs.length} already applied
            </span>
          )}
        </h2>

        {openJobs.length === 0 && jobs.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-emerald-300 bg-white/60 p-12 text-center text-emerald-800">
            No roles match your profile yet. Ask your recruiter to publish jobs or update your
            employment type.
          </div>
        ) : openJobs.length === 0 ? (
          <div className="rounded-3xl border-2 border-lime-300 bg-lime-50 p-12 text-center font-bold text-emerald-900">
            You&apos;ve applied to every matched role. Great work!
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {openJobs.map((job) => (
              <li key={job.id} className="min-h-[280px]">
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}

        {appliedJobs.length > 0 && (
          <details className="group mt-4">
            <summary className="cursor-pointer text-sm font-bold text-emerald-700 hover:text-emerald-900">
              Show roles you already applied to ({appliedJobs.length}) ▾
            </summary>
            <ul className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {appliedJobs.map((job) => {
                const match = interviews.find((i) => i.job_id === job.id);
                return (
                  <li key={job.id} className="min-h-[280px]">
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
