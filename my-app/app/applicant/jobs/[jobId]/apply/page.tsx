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

  if (existing) {
    redirect(`/applicant/jobs/${jobId}/results`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href={`/applicant/jobs/${job.id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← {job.title}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 sm:text-3xl">Apply</h1>
        <p className="mt-2 text-slate-600">
          {job.company_name}
          <span className="mx-2 text-slate-300">·</span>
          {job.employment_type ?? "Role"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { n: "1", t: "Resume & GitHub", d: "PDF or link plus public repository context." },
          { n: "2", t: "Questions", d: "Role-specific prompts from your materials." },
          { n: "3", t: "Assessment", d: "Timed responses with optional video." },
        ].map((s) => (
          <div key={s.n} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
              {s.n}
            </span>
            <p className="mt-2 text-sm font-semibold text-slate-900">{s.t}</p>
            <p className="mt-1 text-xs text-slate-600">{s.d}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <ApplyLauncher job={job} applicant={applicant} />
      </section>
    </div>
  );
}
