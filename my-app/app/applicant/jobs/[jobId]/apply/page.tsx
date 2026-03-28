import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fetchApplicant, fetchJob } from "../../../actions";
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

  const [job, applicant] = await Promise.all([fetchJob(jobId), fetchApplicant(applicantId)]);
  if (!job || !applicant) notFound();

  if (!jobMatchesApplicant(job.employment_type, normalizeEmployment(applicant.employment_type))) {
    redirect("/applicant/jobs");
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <Link href={`/applicant/jobs/${job.id}`} className="text-sm text-cyan-400 hover:text-cyan-300">
          ← Job details
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-white">Apply</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {job.title} <span className="text-zinc-600">·</span> {job.company_name}
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-sm leading-relaxed text-zinc-400">
          Upload a PDF resume (or paste a resume link), add your GitHub repo URL, and we&apos;ll
          pull context server-side, generate role-specific questions, then score answers against the
          recruiter&apos;s rubric.
        </p>
        <div className="mt-6">
          <ApplyLauncher job={job} applicant={applicant} />
        </div>
      </section>
    </div>
  );
}
