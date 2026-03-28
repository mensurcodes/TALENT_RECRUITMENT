import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { fetchJob, fetchJobInterviews } from "../../actions";
import { hasSupabaseConfig } from "../../lib/supabase";
import { SupabaseNotice } from "../../components/SupabaseNotice";
import { requireRecruiterSession } from "../../lib/auth";

type Props = {
  params: Promise<{ jobId: string }>;
};

// inside your page component:
export default async function RecruiterJobDetailPage({ params }: Props) {
  const recruiterId = await requireRecruiterSession();
  const { jobId: raw } = await params;

  const jobId = Number(raw);
  const interviews = await fetchJobInterviews(jobId);

  if (!Number.isFinite(jobId)) redirect("/dashboard");

  if (!hasSupabaseConfig()) {
    return <SupabaseNotice />;
  }

  const job = await fetchJob(jobId);
  if (!job) notFound();

  // Optional: enforce ownership
  if (job.recruiter_id !== recruiterId) {
    redirect("/recruiter");
  }

  return (
    <article className="space-y-8">
      <div>
        <Link
          href="/recruiter"
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Back to dashboard
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
          {job.title}
        </h1>

        <p className="mt-2 text-zinc-400">
          {job.company_name}
          <span className="text-zinc-600"> · </span>
          {job.recruiter_name}
        </p>
      </div>

      {/* Job details */}
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
            <p className="mt-1 text-sm text-zinc-200">
              {job.employment_type ?? "—"}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              U.S. work authorization
            </h3>
            <p className="mt-1 text-sm text-zinc-200">
              {job.us_work_auth ?? "—"}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Grading rubric
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-400">
              {job.grading_rubric?.trim() || "No rubric attached yet."}
            </p>
          </div>
        </aside>
      </section>

      {/* Recruiter actions */}
      <div className="flex flex-wrap gap-3">
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Interviews
          </h2>

          {interviews.length === 0 ? (
            <p className="text-sm text-zinc-500">No interviews yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {interviews.map((interview) => (
                <li
                  key={interview.id}
                  className="rounded-xl bg-white px-5 py-4 text-sm text-zinc-800 ring-1 ring-black/[.06] dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/[.08]"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">
                        {interview.applicant_name}
                      </span>

                      <span className="text-xs text-zinc-500">
                        Recruiter: {interview.recruiter_name}
                      </span>

                      {interview.result && (
                        <span className="text-xs">
                          Result: {interview.result}
                        </span>
                      )}

                      {interview.feedback && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {interview.feedback}
                        </p>
                      )}

                      <span className="text-xs text-zinc-400">
                        {new Date(interview.created_at).toLocaleString()}
                      </span>
                    </div>

                    <a
                      href={`/recruiter/interviews/${interview.id}`}
                      className="text-xs text-cyan-500 hover:underline"
                    >
                      View
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
