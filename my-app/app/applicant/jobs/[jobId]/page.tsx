import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { fetchApplicant, fetchJob, checkExistingApplication } from "../../actions";
import { hasSupabaseConfig } from "../../lib/supabase";
import { jobMatchesApplicant, normalizeEmployment } from "../../lib/employment";
import { SupabaseNotice } from "../../components/SupabaseNotice";
import { requireApplicantSession } from "../../lib/auth";

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function ApplicantJobDetailPage({ params }: Props) {
  const applicantId = await requireApplicantSession();
  const { jobId: raw } = await params;
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

  return (
    <article className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href="/applicant/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Jobs
        </Link>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800 ring-1 ring-blue-100">
                {job.employment_type ?? "Role"}
              </span>
              {alreadyApplied && (
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  Applied
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {job.title}
            </h1>
            <p className="mt-2 text-slate-600">
              {job.company_name}
              <span className="mx-2 text-slate-300">·</span>
              {job.recruiter_name}
            </p>
          </div>
        </div>
      </div>

      {alreadyApplied && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
          <div>
            <p className="font-medium text-slate-900">You have already applied.</p>
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
          <Link
            href={`/applicant/jobs/${job.id}/results`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            View results
          </Link>
        </div>
      )}

      <section className="grid gap-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-3 lg:p-8">
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
        {alreadyApplied ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/results`}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View results
            </Link>
            <Link
              href="/applicant/jobs"
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to jobs
            </Link>
          </>
        ) : (
          <Link
            href={`/applicant/jobs/${job.id}/apply`}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply & start assessment
          </Link>
        )}
      </div>
    </article>
  );
}
