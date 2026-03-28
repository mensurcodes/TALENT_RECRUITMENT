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

  if (existing) {
    redirect(`/applicant/jobs/${jobId}/results`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <div>
        <Link
          href={`/applicant/jobs/${job.id}`}
          className="text-sm font-bold text-emerald-700 hover:text-emerald-950"
        >
          ← {job.title}
        </Link>
        <h1 className="mt-4 text-3xl font-black text-emerald-950 sm:text-4xl">Submit application</h1>
        <p className="mt-2 text-lg font-semibold text-emerald-800">
          {job.company_name}
          <span className="mx-2 text-emerald-300">·</span>
          {job.employment_type ?? "Role"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { n: "1", t: "Resume + GitHub", d: "We read your PDF or link + public repo files." },
          { n: "2", t: "AI questions", d: "Tailored prompts from your real codebase context." },
          { n: "3", t: "Assessment", d: "Timed answers — video + optional notes." },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border-2 border-lime-200 bg-white p-4 shadow-md"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300 text-sm font-black text-emerald-950">
              {s.n}
            </span>
            <p className="mt-2 font-bold text-emerald-950">{s.t}</p>
            <p className="mt-1 text-xs font-medium text-emerald-800">{s.d}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border-2 border-white bg-white p-6 shadow-xl sm:p-8">
        <ApplyLauncher job={job} applicant={applicant} />
      </section>
    </div>
  );
}
