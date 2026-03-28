"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { InterviewRow, RubricEvaluation, StoredAssessment } from "../../../types";
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

function scoreColor(score: number, max: number) {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return "text-emerald-400";
  if (pct >= 0.5) return "text-amber-400";
  return "text-rose-400";
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? score / max : 0;
  const color =
    pct >= 0.75
      ? "stroke-emerald-400"
      : pct >= 0.5
        ? "stroke-amber-400"
        : "stroke-rose-400";
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={104} height={104} className="-rotate-90">
        <circle cx={52} cy={52} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={52}
          cy={52}
          r={r}
          fill="none"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className={color}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`font-mono text-2xl font-bold tabular-nums ${scoreColor(score, max)}`}>
          {score}
        </span>
        <span className="text-xs text-zinc-500">/ {max}</span>
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
      // 1. Try sessionStorage first (most current session)
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
            // Save to DB (once)
            if (!savedRef.current && s.evaluation) {
              savedRef.current = true;
              saveApplicationResult({
                jobId,
                applicantId,
                evaluation: s.evaluation,
                resumeLabel: s.resumeUrl ?? "",
                githubUrl: s.githubUrl ?? "",
              }).catch(() => {});
            }
            return;
          }
        }
      } catch {}

      // 2. Fallback: load from Supabase (previous session or different device)
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
      </div>
    );
  }

  if (!display) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <p className="text-sm text-zinc-400">No results found for this job.</p>
        <p className="mt-1 text-xs text-zinc-600">
          Complete an assessment first, or sign in to the account that submitted the application.
        </p>
        <Link
          href={`/applicant/jobs/${jobId}`}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Back to job
        </Link>
      </div>
    );
  }

  const ev = display.evaluation;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/applicant/jobs"
          className="inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← All applications
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Assessment results</h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              {display.jobTitle}
              <span className="mx-2 text-zinc-700">·</span>
              {display.companyName}
            </p>
            {display.submittedAt && (
              <p className="mt-1 text-xs text-zinc-600">
                Submitted {new Date(display.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
            Submitted
          </span>
        </div>
      </div>

      {ev ? (
        <>
          {/* Score + summary */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <ScoreRing score={ev.overallScore} max={ev.maxScore} />
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Score</p>
              </div>
              <div className="flex-1">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  Overall summary
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{ev.summary}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
                  {display.resumeLabel && (
                    <span className="flex items-center gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-600" />
                      {display.resumeLabel.startsWith("PDF:") ? display.resumeLabel : "Resume: " + display.resumeLabel}
                    </span>
                  )}
                  {display.githubUrl && (
                    <a
                      href={display.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 transition hover:text-cyan-400"
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-600" />
                      GitHub repo
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Strengths + improvements */}
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Strengths
              </h3>
              {ev.strengths.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {ev.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/60" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-600">No details available.</p>
              )}
            </section>
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 2v4M6 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Areas to improve
              </h3>
              {ev.improvements.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {ev.improvements.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-zinc-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/60" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-600">No details available.</p>
              )}
            </section>
          </div>

          {/* Rubric breakdown */}
          {ev.rubricBreakdown.length > 0 && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Rubric breakdown
              </h3>
              <ul className="mt-4 divide-y divide-white/5">
                {ev.rubricBreakdown.map((row, i) => {
                  const pct = row.max > 0 ? row.score / row.max : 0;
                  return (
                    <li key={i} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-200">{row.criterion}</span>
                        <span className={`font-mono text-sm font-semibold ${scoreColor(row.score, row.max)}`}>
                          {row.score}/{row.max}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full ${pct >= 0.75 ? "bg-emerald-500" : pct >= 0.5 ? "bg-amber-500" : "bg-rose-500"}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                      {row.note && <p className="mt-1 text-xs text-zinc-500">{row.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-500">
          Evaluation is being processed or is not available.
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link
          href={`/applicant/jobs/${jobId}`}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white"
        >
          Job details
        </Link>
        <Link
          href="/applicant/jobs"
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400"
        >
          All matched jobs
        </Link>
      </div>
    </div>
  );
}
