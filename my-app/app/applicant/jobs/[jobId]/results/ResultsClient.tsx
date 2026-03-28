"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RubricEvaluation, StoredAssessment } from "../../../types";
import { APPLICANT_ASSESSMENT_KEY } from "../../../types";
import { saveApplicationResult, fetchInterviewForJob } from "../../../actions";

type DisplayResult = {
  applicantName: string;
  jobTitle: string;
  companyName: string;
  evaluation: RubricEvaluation | null;
  submittedAt: string | null;
  resumeLabel: string;
  githubUrl: string;
};

function scoreTone(score: number, max: number) {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return "text-blue-800";
  if (pct >= 0.5) return "text-slate-800";
  return "text-slate-600";
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? score / max : 0;
  const stroke = pct >= 0.75 ? "stroke-blue-600" : pct >= 0.5 ? "stroke-slate-500" : "stroke-slate-400";
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={104} height={104} className="-rotate-90">
        <circle cx={52} cy={52} r={r} fill="none" stroke="#e2e8f0" strokeWidth={8} />
        <circle
          cx={52}
          cy={52}
          r={r}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className={stroke}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-mono text-2xl font-semibold tabular-nums ${scoreTone(score, max)}`}>
          {score}
        </span>
        <span className="text-xs text-slate-500">/ {max}</span>
      </div>
    </div>
  );
}

export function ResultsClient({
  jobId,
  applicantId,
}: {
  jobId: number;
  applicantId: number;
}) {
  const [display, setDisplay] = useState<DisplayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const savedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const raw = sessionStorage.getItem(APPLICANT_ASSESSMENT_KEY);
        if (raw) {
          const s = JSON.parse(raw) as StoredAssessment;
          if (s.jobId === jobId && s.applicantId === applicantId && s.evaluation) {
            if (active) {
              setDisplay({
                applicantName: s.applicantName,
                jobTitle: s.job.title,
                companyName: s.job.company_name,
                evaluation: s.evaluation,
                submittedAt: s.submittedAt,
                resumeLabel: s.resumeUrl ?? "",
                githubUrl: s.githubUrl ?? "",
              });
              setLoading(false);
            }
            if (!savedRef.current && s.evaluation) {
              savedRef.current = true;
              saveApplicationResult({
                jobId,
                applicantId,
                evaluation: s.evaluation,
                resumeLabel: s.resumeUrl ?? "",
                githubUrl: s.githubUrl ?? "",
                questionDetails: Array.isArray(s.questionDetails) ? s.questionDetails : [],
              }).catch(() => {});
            }
            return;
          }
        }
      } catch {}

      try {
        const interview = await fetchInterviewForJob(applicantId, jobId);
        if (interview && active) {
          setDisplay({
            applicantName: interview.applicant_name,
            jobTitle: interview.job?.title ?? `Job #${jobId}`,
            companyName: interview.job?.company_name ?? "",
            evaluation: interview.summary
              ? {
                  overallScore: interview.score ?? 0,
                  maxScore: interview.max_score ?? 100,
                  summary: interview.summary,
                  strengths: [],
                  improvements: [],
                  rubricBreakdown: [],
                }
              : null,
            submittedAt: interview.submitted_at,
            resumeLabel: interview.resume_label ?? "",
            githubUrl: interview.github_url ?? "",
          });
        }
      } catch {}

      if (active) setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [applicantId, jobId]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!display) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="font-medium text-slate-900">No results for this job.</p>
        <p className="mt-2 text-sm text-slate-600">Complete an assessment or use the account that applied.</p>
        <Link href={`/applicant/jobs/${jobId}`} className="mt-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700">
          ← Back to job
        </Link>
      </div>
    );
  }

  const ev = display.evaluation;

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <Link
          href="/applicant/jobs"
          className="text-[13px] font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
        >
          ← All applications
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600/90">Results</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl">
              Assessment
            </h1>
            <p className="mt-2 text-[15px] text-slate-600">
              {display.jobTitle}
              <span className="mx-2 text-slate-300">·</span>
              {display.companyName}
            </p>
            {display.submittedAt && (
              <p className="mt-1 text-sm text-slate-500">
                Submitted{" "}
                {new Date(display.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-800 ring-1 ring-blue-100/80">
            Submitted
          </span>
        </div>
      </div>

      {ev ? (
        <>
          <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_60px_-28px_rgba(37,99,235,0.15)] ring-1 ring-slate-900/[0.04]">
            <div className="flex flex-col gap-6 border-b border-slate-100 bg-gradient-to-br from-blue-50/50 to-white p-6 sm:flex-row sm:items-center sm:p-10">
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={ev.overallScore} max={ev.maxScore} />
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Score</p>
              </div>
              <div className="flex-1">
                <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">Summary</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-800">{ev.summary}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
                  {display.resumeLabel && <span>{display.resumeLabel}</span>}
                  {display.githubUrl && (
                    <a
                      href={display.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      GitHub repository
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm ring-1 ring-slate-900/[0.03] transition-shadow duration-300 hover:shadow-md">
              <h3 className="text-xs font-medium uppercase tracking-wide text-blue-700">Strengths</h3>
              {ev.strengths.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {ev.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">—</p>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm ring-1 ring-slate-900/[0.03] transition-shadow duration-300 hover:shadow-md">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-600">Areas to improve</h3>
              {ev.improvements.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {ev.improvements.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">—</p>
              )}
            </section>
          </div>

          {ev.rubricBreakdown.length > 0 && (
            <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-sm ring-1 ring-slate-900/[0.03]">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">Rubric breakdown</h3>
              <ul className="mt-4 divide-y divide-slate-100">
                {ev.rubricBreakdown.map((row, i) => {
                  const pct = row.max > 0 ? row.score / row.max : 0;
                  return (
                    <li key={i} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900">{row.criterion}</span>
                        <span className={`font-mono text-sm font-semibold ${scoreTone(row.score, row.max)}`}>
                          {row.score}/{row.max}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${pct >= 0.75 ? "bg-blue-600" : pct >= 0.5 ? "bg-slate-500" : "bg-slate-400"}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                      {row.note && <p className="mt-1 text-xs text-slate-600">{row.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Evaluation not available.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/applicant/jobs/${jobId}`}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
        >
          Job details
        </Link>
        <Link
          href="/applicant/jobs"
          className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all duration-200 hover:shadow-lg"
        >
          Back to jobs
        </Link>
      </div>
    </div>
  );
}
