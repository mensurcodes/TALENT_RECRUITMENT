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
        <Link href="/applicant" className="text-sm text-cyan-400 hover:text-cyan-300">
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
    <article className="space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/applicant/jobs"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← Job board
        </Link>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-xs font-medium text-cyan-200">
                {job.employment_type ?? "Role"}
              </span>
              {alreadyApplied && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                  Applied
                </span>
              )}
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {job.title}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              {job.company_name}
              <span className="mx-1.5 text-zinc-700">·</span>
              Posted by {job.recruiter_name}
            </p>
          </div>
        </div>
      </div>

      {/* Already applied banner */}
      {alreadyApplied && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              You&apos;ve already submitted an application for this role.
            </p>
            {existing.submitted_at && (
              <p className="mt-0.5 text-xs text-zinc-500">
                Submitted{" "}
                {new Date(existing.submitted_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {existing.score !== null && (
                  <> · Score: {existing.score}/{existing.max_score ?? 100}</>
                )}
              </p>
            )}
          </div>
          <Link
            href={`/applicant/jobs/${job.id}/results`}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#021a0e] transition hover:bg-emerald-400"
          >
            View my results
          </Link>
        </div>
      )}

      {/* Job details grid */}
      <section className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Job description
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {job.description?.trim() || "No description provided."}
          </p>
        </div>
        <aside className="space-y-5 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              Employment
            </h3>
            <p className="mt-1.5 text-sm text-zinc-200">{job.employment_type ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
              U.S. work authorization
            </h3>
            <p className="mt-1.5 text-sm text-zinc-200">{job.us_work_auth ?? "—"}</p>
          </div>
          {job.grading_rubric && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
                Grading rubric
              </h3>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-zinc-400">
                {job.grading_rubric.trim()}
              </p>
            </div>
          )}
        </aside>
      </section>

      {/* CTA */}
      <div className="flex flex-wrap gap-3">
        {alreadyApplied ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/results`}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-[#021a0e] transition hover:bg-emerald-400"
            >
              View my results
            </Link>
            <Link
              href="/applicant/jobs"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
            >
              Back to job board
            </Link>
          </>
        ) : (
          <Link
            href={`/applicant/jobs/${job.id}/apply`}
            className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400"
          >
            Apply & start assessment →
          </Link>
        )}
      </div>
    </article>
  );
}
