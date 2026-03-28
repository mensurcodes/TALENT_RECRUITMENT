import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { fetchApplicant, fetchJob } from "../../actions";
import { hasSupabaseConfig } from "../../lib/supabase";
import { jobMatchesApplicant, normalizeEmployment } from "../../lib/employment";
import { SupabaseNotice } from "../../components/SupabaseNotice";

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ applicantId?: string }>;
};

export default async function ListenerJobDetailPage({ params, searchParams }: Props) {
  const { jobId: raw } = await params;
  const sp = await searchParams;
  const jobId = Number(raw);
  const applicantId = Number(sp.applicantId);
  if (!Number.isFinite(jobId) || !Number.isFinite(applicantId)) redirect("/listener");

  if (!hasSupabaseConfig()) {
    return (
      <div className="space-y-6">
        <SupabaseNotice />
        <Link href="/listener" className="text-sm text-cyan-400 hover:text-cyan-300">
          ← Back
        </Link>
      </div>
    );
  }

  const [job, applicant] = await Promise.all([fetchJob(jobId), fetchApplicant(applicantId)]);
  if (!job || !applicant) notFound();

  if (!jobMatchesApplicant(job.employment_type, normalizeEmployment(applicant.employment_type))) {
    redirect(`/listener/jobs?applicantId=${applicantId}`);
  }

  const q = new URLSearchParams({ applicantId: String(applicantId) });

  return (
    <article className="space-y-8">
      <div>
        <Link
          href={`/listener/jobs?applicantId=${applicantId}`}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Matched jobs
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">{job.title}</h1>
        <p className="mt-2 text-zinc-400">
          {job.company_name}
          <span className="text-zinc-600"> · </span>
          Recruiter: {job.recruiter_name}
        </p>
      </div>

      <section className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Description
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
            {job.description?.trim() || "No description provided."}
          </p>
        </div>
        <aside className="space-y-4 border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Employment
            </h3>
            <p className="mt-1 text-sm text-zinc-200">{job.employment_type ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              U.S. work authorization
            </h3>
            <p className="mt-1 text-sm text-zinc-200">{job.us_work_auth ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Grading rubric
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-400">
              {job.grading_rubric?.trim() || "Recruiter has not attached a rubric yet."}
            </p>
          </div>
        </aside>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/listener/jobs/${job.id}/apply?${q.toString()}`}
          className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400"
        >
          Apply & start assessment
        </Link>
      </div>
    </article>
  );
}
