import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchInterviewsForJob, fetchJobForRecruiter } from "../../actions";
import { hasSupabaseConfig } from "../../../applicant/lib/supabase";
import { SupabaseNotice } from "../../../applicant/components/SupabaseNotice";
import { requireRecruiterSession } from "../../lib/auth";
import { deriveWeakestPoints, parseStoredEvaluation } from "../../../applicant/lib/evaluationParse";

type Props = { params: Promise<{ jobId: string }> };

export default async function RecruiterJobApplicantsPage({ params }: Props) {
  const recruiterId = await requireRecruiterSession();
  const { jobId: raw } = await params;
  const jobId = Number(raw);
  if (!Number.isFinite(jobId)) notFound();

  if (!hasSupabaseConfig()) {
    return <SupabaseNotice />;
  }

  const job = await fetchJobForRecruiter(recruiterId, jobId);
  if (!job) notFound();

  const interviews = await fetchInterviewsForJob(recruiterId, jobId);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/recruiter/dashboard" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
          ← Dashboard
        </Link>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600/90">Applicants</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{job.title}</h1>
        <p className="mt-1 text-sm text-slate-600">{job.company_name}</p>
      </div>

      {interviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
          No applications for this job yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {interviews.map((inv) => {
            const ev = parseStoredEvaluation(inv.evaluation);
            const weak = ev ? deriveWeakestPoints(ev) : [];
            const done = Boolean(inv.submitted_at);
            return (
              <li
                key={inv.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-600">#{inv.id}</span>
                      <span className="text-sm font-semibold text-slate-900">{inv.applicant_name}</span>
                      {!done ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200/80">
                          In progress
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-900 ring-1 ring-emerald-200/80">
                          Submitted
                        </span>
                      )}
                    </div>
                    {inv.score != null && (
                      <p className="mt-2 text-sm text-slate-700">
                        Score:{" "}
                        <span className="font-mono font-semibold">
                          {inv.score}/{inv.max_score ?? 100}
                        </span>
                      </p>
                    )}
                    {inv.summary && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{inv.summary}</p>
                    )}
                    {weak.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700/90">
                          Weakest areas
                        </p>
                        <ul className="mt-1 list-inside list-disc text-[13px] text-slate-700">
                          {weak.slice(0, 2).map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    {done && ev ? (
                      <a
                        href={`/api/recruiter/assessment-report/${inv.id}`}
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-500/20"
                      >
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">PDF available after submission</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
