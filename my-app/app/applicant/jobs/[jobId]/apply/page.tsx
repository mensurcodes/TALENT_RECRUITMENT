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
};

export default async function ApplyPage({ params }: Props) {
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

  // Already applied — redirect to results
  if (existing) {
    redirect(`/applicant/jobs/${jobId}/results`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/applicant/jobs/${job.id}`}
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← {job.title}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
          Submit your application
        </h1>
        <p className="mt-1.5 text-sm text-zinc-400">
          {job.company_name}
          <span className="mx-1.5 text-zinc-700">·</span>
          {job.employment_type ?? "Role"}
        </p>
      </div>

      {/* How it works */}
      <ol className="grid gap-3 sm:grid-cols-3">
        {[
          { n: "1", label: "Upload resume + GitHub", desc: "PDF or link — we extract text server-side." },
          { n: "2", label: "AI generates questions", desc: "Role-specific, based on your experience." },
          { n: "3", label: "Timed assessment", desc: "Answer written/video questions at your own pace." },
        ].map((step) => (
          <li
            key={step.n}
            className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-300">
              {step.n}
            </span>
            <div>
              <p className="text-xs font-semibold text-zinc-200">{step.label}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{step.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Form */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <ApplyLauncher job={job} applicant={applicant} />
      </section>
    </div>
  );
}
