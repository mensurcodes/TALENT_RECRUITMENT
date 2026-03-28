import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fetchApplicant, fetchJob, checkExistingApplication } from "../../../actions";
import { hasSupabaseConfig } from "../../../lib/supabase";
import { jobMatchesApplicant, normalizeEmployment } from "../../../lib/employment";
import { SupabaseNotice } from "../../../components/SupabaseNotice";
import { ApplyLauncher } from "./ApplyLauncher";
import { requireApplicantSession } from "../../../lib/auth";

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ assessment?: string }>;
};

export default async function ApplyPage({ params, searchParams }: Props) {
  const applicantId = await requireApplicantSession();
  const { jobId: raw } = await params;
  const { assessment: assessmentParam } = await searchParams;
  const jobId = Number(raw);
  if (!Number.isFinite(jobId)) redirect("/applicant/jobs");

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

  const [job, applicant, existing] = await Promise.all([
    fetchJob(jobId),
    fetchApplicant(applicantId),
    checkExistingApplication(applicantId, jobId),
  ]);
  if (!job || !applicant) notFound();

  if (!jobMatchesApplicant(job.employment_type, normalizeEmployment(applicant.employment_type))) {
    redirect("/applicant/jobs");
  }

  if (existing) {
    redirect(`/applicant/jobs/${jobId}/results`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {assessmentParam === "cancelled" ? (
        <div className="rounded-2xl border border-amber-200/90 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
          Your assessment was ended because you left the assessment page. You can start again from this application
          form.
        </div>
      ) : null}
      <div>
        <Link
          href={`/applicant/jobs/${job.id}`}
          className="text-[13px] font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
        >
          ← {job.title}
        </Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600/90">Application</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">Apply</h1>
        <p className="mt-2 text-[15px] text-slate-600">
          {job.company_name}
          <span className="mx-2 text-slate-300">·</span>
          {job.employment_type ?? "Role"}
        </p>
      </div>

      <div className="applicant-stagger grid gap-4 sm:grid-cols-3">
        {[
          { n: "1", t: "Resume + GitHub", d: "PDF or link; repos matched to your resume when possible." },
          { n: "2", t: "Five questions", d: "Engineering depth: design, trade-offs, how well you know your work." },
          { n: "3", t: "Assessment", d: "Timed answers, optional video." },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-slate-200/90 bg-white/80 p-5 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-blue-200/60 hover:shadow-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-md shadow-blue-500/20">
              {s.n}
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{s.t}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{s.d}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-[0_20px_60px_-28px_rgba(37,99,235,0.12)] ring-1 ring-slate-900/[0.04] backdrop-blur-sm sm:p-8">
        <ApplyLauncher job={job} applicant={applicant} />
      </section>
    </div>
  );
}
