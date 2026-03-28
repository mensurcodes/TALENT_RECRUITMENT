import Link from "next/link";
import { fetchApplicant, fetchQualifiedJobs, fetchMyInterviews } from "../actions";
import { hasSupabaseConfig } from "../lib/supabase";
import { normalizeEmployment } from "../lib/employment";
import { deriveWeakestPoints, parseStoredEvaluation } from "../lib/evaluationParse";
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

function isInterviewComplete(i: InterviewRow): boolean {
  return Boolean(i.submitted_at) && (i.assessment_status === "completed" || i.score != null);
}

function PendingInterviewCard({ interview }: { interview: InterviewRow }) {
  const title = interview.job?.title ?? `Job #${interview.job_id}`;
  const company = interview.job?.company_name ?? "";
  const applied = interview.applied_at ?? interview.created_at;
  const deadline = interview.assessment_deadline_at;
  const deadlinePassed = deadline ? new Date(deadline).getTime() < Date.now() : false;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 shadow-sm ring-1 ring-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200/90">
            Interview #{interview.id}
          </span>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/80">
            {deadlinePassed ? "Deadline passed" : "Action required"}
          </span>
        </div>
        <p className="mt-2 text-base font-semibold tracking-tight text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-600">
          {company}
          {applied && (
            <>
              <span className="mx-2 text-slate-300">·</span>
              <span className="text-slate-500">
                Applied{" "}
                {new Date(applied).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </>
          )}
        </p>
        {deadline && !deadlinePassed && (
          <p className="mt-1 text-[13px] text-amber-950/90">
            Complete interview by{" "}
            {new Date(deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {!deadlinePassed ? (
          <Link
            href={`/applicant/jobs/${interview.job_id}/assessment`}
            className="rounded-xl bg-gradient-to-b from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-amber-500/25 transition-all duration-200 hover:shadow-lg"
          >
            Continue interview
          </Link>
        ) : (
          <Link
            href={`/applicant/jobs/${interview.job_id}/apply`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Application details
          </Link>
        )}
        <Link
          href={`/applicant/jobs/${interview.job_id}`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
        >
          Role
        </Link>
      </div>
    </article>
  );
}

function PastApplicationCard({ interview }: { interview: InterviewRow }) {
  const title = interview.job?.title ?? `Job #${interview.job_id}`;
  const company = interview.job?.company_name ?? "";
  const ev = parseStoredEvaluation(interview.evaluation);
  const weakest = ev ? deriveWeakestPoints(ev) : [];
  const canPdf = Boolean(ev);

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200/90">
            Interview #{interview.id}
          </span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-200/80">
            Completed
          </span>
          {interview.score !== null ? <ScorePill score={interview.score} max={interview.max_score} /> : null}
        </div>
        <p className="mt-2 text-base font-semibold tracking-tight text-slate-900">{title}</p>
        <p className="mt-0.5 text-sm text-slate-600">{company}</p>
        {interview.submitted_at && (
          <p className="mt-1 text-[13px] text-slate-500">
            Submitted{" "}
            {new Date(interview.submitted_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
        {ev ? (
          <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-slate-700">{ev.summary}</p>
        ) : interview.summary ? (
          <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-slate-700">{interview.summary}</p>
        ) : null}
        {weakest.length > 0 ? (
          <div className="mt-4 rounded-xl border border-rose-100/90 bg-rose-50/50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700/90">Weakest areas</p>
            <ul className="mt-3 space-y-2">
              {weakest.slice(0, 3).map((w) => (
                <li key={w} className="flex gap-2 text-[13px] text-rose-950/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!ev && interview.summary && (
          <p className="mt-2 text-xs text-slate-500">
            Full rubric breakdown is available after you re-save results from a recent session, or re-run the assessment
            with the latest app version.
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        <Link
          href={`/applicant/jobs/${interview.job_id}/results`}
          className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:shadow-lg"
        >
          View full report
        </Link>
        {canPdf ? (
          <a
            href={`/api/applicant/assessment-report/${interview.id}`}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-xs font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50"
          >
            Download PDF
          </a>
        ) : null}
        <Link
          href={`/applicant/jobs/${interview.job_id}`}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Role
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

  const completed = interviews.filter(isInterviewComplete);
  const pending = interviews.filter((i) => !isInterviewComplete(i));

  return (
    <div className="space-y-14">
      <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-8 shadow-[0_20px_60px_-28px_rgba(37,99,235,0.15)] ring-1 ring-slate-900/[0.04] backdrop-blur-md sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600/90">Your pipeline</p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">Applicant portal</h1>
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
              {openJobs.length} open
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[13px] font-medium text-amber-900">
              {pending.length} pending
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] font-medium text-emerald-900">
              {completed.length} past
            </span>
          </div>
        </div>
      </div>

      <section className="space-y-5">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500">Available positions</h2>
          <p className="mt-1 text-sm text-slate-600">
            Roles that match your profile and you haven&apos;t applied to yet.
          </p>
        </div>
        {openJobs.length === 0 && jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-12 text-center text-sm text-slate-600">
            No roles match your profile yet.
          </div>
        ) : openJobs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-12 text-center text-sm text-slate-600">
            You&apos;ve applied to all matched roles. See pending or past applications below.
          </div>
        ) : (
          <ul className="applicant-stagger grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {openJobs.map((job) => (
              <li key={job.id} className="min-h-[260px]">
                <JobCard job={job} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-amber-700/90">
            Pending — complete your interview
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            You&apos;ve applied; finish the timed assessment within 7 days of applying. Videos attach to your interview
            ID in <span className="font-mono text-slate-700">assessment-videos</span>.
          </p>
        </div>
        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-600">
            No pending interviews.
          </div>
        ) : (
          <ul className="applicant-stagger space-y-3">
            {pending.map((interview) => (
              <li key={interview.id}>
                <PendingInterviewCard interview={interview} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-emerald-700/90">Past applications</h2>
          <p className="mt-1 text-sm text-slate-600">
            Summary, focus areas (weakest points), and a PDF export that matches the recruiter-facing report structure.
          </p>
        </div>
        {completed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-600">
            No completed assessments yet.
          </div>
        ) : (
          <ul className="applicant-stagger space-y-3">
            {completed.map((interview) => (
              <li key={interview.id}>
                <PastApplicationCard interview={interview} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
