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
        <Link href="/applicant" className="text-sm font-bold text-emerald-800 underline">
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
    <article className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <Link
          href="/applicant/jobs"
          className="text-sm font-bold text-emerald-700 hover:text-emerald-950"
        >
          ← Job board
        </Link>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gradient-to-r from-yellow-300 to-lime-300 px-3 py-1 text-xs font-black text-emerald-950">
                {job.employment_type ?? "Role"}
              </span>
              {alreadyApplied && (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-black text-white shadow">
                  Applied
                </span>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              {job.title}
            </h1>
            <p className="mt-2 text-lg font-semibold text-emerald-800">
              {job.company_name}
              <span className="mx-2 text-emerald-300">·</span>
              {job.recruiter_name}
            </p>
          </div>
        </div>
      </div>

      {alreadyApplied && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-lime-100 to-emerald-100 p-5 shadow-md">
          <div>
            <p className="text-base font-black text-emerald-950">You already applied to this role.</p>
            {existing.submitted_at && (
              <p className="mt-1 text-sm font-semibold text-emerald-800">
                Submitted{" "}
                {new Date(existing.submitted_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {existing.score !== null && (
                  <>
                    {" "}
                    · Score <span className="font-black">{existing.score}</span>/
                    {existing.max_score ?? 100}
                  </>
                )}
              </p>
            )}
          </div>
          <Link
            href={`/applicant/jobs/${job.id}/results`}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-lg"
          >
            View results →
          </Link>
        </div>
      )}

      <section className="grid gap-6 rounded-3xl border-2 border-white bg-white p-6 shadow-xl lg:grid-cols-3 lg:p-8">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-lime-700">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
            {job.description?.trim() || "No description provided."}
          </p>
        </div>
        <aside className="space-y-5 border-t-2 border-emerald-100 pt-6 lg:border-l-2 lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Employment</h3>
            <p className="mt-1.5 font-semibold text-emerald-950">{job.employment_type ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Work authorization</h3>
            <p className="mt-1.5 font-semibold text-emerald-950">{job.us_work_auth ?? "—"}</p>
          </div>
          {job.grading_rubric && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">Rubric</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-emerald-800">{job.grading_rubric.trim()}</p>
            </div>
          )}
        </aside>
      </section>

      <div className="flex flex-wrap gap-3">
        {alreadyApplied ? (
          <>
            <Link
              href={`/applicant/jobs/${job.id}/results`}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 px-6 py-3 text-sm font-black text-white shadow-lg"
            >
              View my results
            </Link>
            <Link
              href="/applicant/jobs"
              className="rounded-xl border-2 border-emerald-200 bg-white px-6 py-3 text-sm font-bold text-emerald-900"
            >
              Back to board
            </Link>
          </>
        ) : (
          <Link
            href={`/applicant/jobs/${job.id}/apply`}
            className="rounded-xl bg-gradient-to-r from-yellow-400 to-lime-500 px-8 py-3.5 text-base font-black text-emerald-950 shadow-lg"
          >
            Apply & start assessment →
          </Link>
        )}
      </div>
    </article>
  );
}
