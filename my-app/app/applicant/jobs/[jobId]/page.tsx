import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { fetchApplicant, fetchJob, checkExistingApplication } from "../../actions";
import { hasSupabaseConfig } from "../../lib/supabase";
import { jobMatchesApplicant, normalizeEmployment } from "../../lib/employment";
import { SupabaseNotice } from "../../components/SupabaseNotice";
import { requireApplicantSession } from "../../lib/auth";

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ interview?: string }>;
};

export default async function ApplicantJobDetailPage({ params, searchParams }: Props) {
  const applicantId = await requireApplicantSession();
  const { jobId: raw } = await params;
  const { interview: interviewParam } = await searchParams;
  const jobId = Number(raw);
  if (!Number.isFinite(jobId)) redirect("/applicant/jobs");

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

  const [job, applicant, existing] = await Promise.all([
    fetchJob(jobId),
    fetchApplicant(applicantId),
    checkExistingApplication(applicantId, jobId),
  ]);
  if (!job || !applicant) notFound();

  if (!jobMatchesApplicant(job.employment_type, normalizeEmployment(applicant.employment_type))) {
    redirect("/applicant/jobs");
  }

  const alreadyApplied = existing !== null;
  const pendingInterview =
    existing && !existing.submitted_at && existing.assessment_status !== "completed";
  const deadlineIso = existing?.assessment_deadline_at ?? null;
  const deadlinePassed = deadlineIso ? new Date(deadlineIso).getTime() < Date.now() : false;

  return (
    <article className="mx-auto max-w-4xl space-y-10">
      <div>
        <Link
          href="/applicant/jobs"
          className="text-[13px] font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
        >
          ← Jobs
        </Link>
        <div className="mt-5 flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600/90">Role</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-800 ring-1 ring-blue-100/80">
                {job.employment_type ?? "Role"}
              </span>
              {alreadyApplied && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                  Applied
                </span>
              )}
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-[2rem] sm:leading-tight">
              {job.title}
            </h1>
            <p className="mt-2 text-[15px] text-slate-600">
              {job.company_name}
              <span className="mx-2 text-slate-300">·</span>
              {job.recruiter_name}
            </p>
          </div>
        </div>
      </div>

      {interviewParam === "expired" ? (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          The 7-day window to complete your interview for this role has passed. Contact the employer if you need a new
          link.
        </div>
      ) : null}

      {alreadyApplied && existing && (
        <div className="flex flex-col gap-4 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white p-6 shadow-sm ring-1 ring-blue-500/5 transition-shadow duration-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700/90">
              Interview #{existing.id}
            </p>
            <p className="mt-1 font-semibold text-slate-900">Application received</p>
            {existing.applied_at && (
              <p className="mt-1 text-sm text-slate-600">
                Applied{" "}
                {new Date(existing.applied_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {deadlineIso && !deadlinePassed && (
              <p className="mt-1 text-sm text-slate-600">
                Complete interview by{" "}
                {new Date(deadlineIso).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {existing.submitted_at && (
              <p className="mt-1 text-sm text-slate-600">
                Submitted{" "}
                {new Date(existing.submitted_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {existing.score !== null && (
                  <>
                    {" "}
                    · Score {existing.score}/{existing.max_score ?? 100}
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingInterview && !deadlinePassed ? (
              <Link
                href={`/applicant/jobs/${job.id}/assessment`}
                className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all duration-200 hover:shadow-lg"
              >
                Continue interview
              </Link>
            ) : null}
            {existing.submitted_at && existing.score !== null ? (
              <Link
                href={`/applicant/jobs/${job.id}/results`}
                className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all duration-200 hover:shadow-lg"
              >
                View results
              </Link>
            ) : null}
          </div>
        </div>
      )}

      <section className="grid gap-8 rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04] backdrop-blur-sm lg:grid-cols-3 lg:p-10">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {job.description?.trim() || "No description provided."}
          </p>
        </div>
        <aside className="space-y-5 border-t border-slate-200 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Employment</h3>
            <p className="mt-1 text-sm font-medium text-slate-900">{job.employment_type ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Work authorization</h3>
            <p className="mt-1 text-sm font-medium text-slate-900">{job.us_work_auth ?? "—"}</p>
          </div>
          {job.grading_rubric && (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Rubric</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{job.grading_rubric.trim()}</p>
            </div>
          )}
        </aside>
      </section>

      <div className="flex flex-wrap gap-3">
        {alreadyApplied && existing && pendingInterview && !deadlinePassed ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/assessment`}
              className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl"
            >
              Continue interview
            </Link>
            <Link
              href="/applicant/jobs"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
            >
              Back to jobs
            </Link>
          </>
        ) : alreadyApplied && existing && existing.submitted_at ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/results`}
              className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl"
            >
              View results
            </Link>
            <Link
              href="/applicant/jobs"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
            >
              Back to jobs
            </Link>
          </>
        ) : alreadyApplied ? (
          <Link
            href="/applicant/jobs"
            className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
          >
            Back to jobs
          </Link>
        ) : (
          <Link
            href={`/applicant/jobs/${job.id}/apply`}
            className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
          >
            Apply & start assessment
          </Link>
        )}
      </div>
    </article>
  );
}
