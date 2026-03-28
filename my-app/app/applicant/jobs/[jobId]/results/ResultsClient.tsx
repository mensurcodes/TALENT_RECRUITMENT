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

function scoreColor(score: number, max: number) {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.75) return "text-emerald-700";
  if (pct >= 0.5) return "text-amber-700";
  return "text-orange-700";
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? score / max : 0;
  const color =
    pct >= 0.75 ? "stroke-emerald-600" : pct >= 0.5 ? "stroke-yellow-500" : "stroke-orange-500";
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <div className="relative flex items-center justify-center">
      <svg width={104} height={104} className="-rotate-90 drop-shadow-sm">
        <circle cx={52} cy={52} r={r} fill="none" stroke="#d1fae5" strokeWidth={8} />
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
        <span className={`font-mono text-2xl font-black tabular-nums ${scoreColor(score, max)}`}>
          {score}
        </span>
        <span className="text-xs font-bold text-emerald-600">/ {max}</span>
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
      <div className="flex min-h-[40vh] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-lime-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!display) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border-2 border-emerald-200 bg-white p-10 text-center shadow-xl">
        <p className="font-bold text-emerald-950">No results for this job yet.</p>
        <p className="mt-2 text-sm font-medium text-emerald-800">
          Finish an assessment or sign in with the account that applied.
        </p>
        <Link
          href={`/applicant/jobs/${jobId}`}
          className="mt-6 inline-block font-black text-lime-700 underline"
        >
          ← Back to job
        </Link>
      </div>
    );
  }

  const ev = display.evaluation;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <div>
        <Link href="/applicant/jobs" className="text-sm font-bold text-emerald-700 hover:text-emerald-950">
          ← All applications
        </Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-emerald-950 sm:text-4xl">Your results</h1>
            <p className="mt-2 text-lg font-semibold text-emerald-800">
              {display.jobTitle}
              <span className="mx-2 text-emerald-300">·</span>
              {display.companyName}
            </p>
            {display.submittedAt && (
              <p className="mt-1 text-sm font-medium text-emerald-600">
                Submitted{" "}
                {new Date(display.submittedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          <span className="rounded-full bg-lime-300 px-4 py-1.5 text-xs font-black text-emerald-950 shadow">
            Submitted
          </span>
        </div>
      </div>

      {ev ? (
        <>
          <section className="overflow-hidden rounded-3xl border-2 border-white bg-white shadow-xl">
            <div className="flex flex-col gap-6 bg-gradient-to-r from-yellow-50 via-lime-50 to-emerald-50 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="flex shrink-0 flex-col items-center gap-2">
                <ScoreRing score={ev.overallScore} max={ev.maxScore} />
                <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Score</p>
              </div>
              <div className="flex-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-lime-800">Summary</h2>
                <p className="mt-2 text-sm font-medium leading-relaxed text-emerald-950">{ev.summary}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-emerald-800">
                  {display.resumeLabel && (
                    <span>
                      📎 {display.resumeLabel.startsWith("PDF:") ? display.resumeLabel : display.resumeLabel}
                    </span>
                  )}
                  {display.githubUrl && (
                    <a
                      href={display.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-700 underline"
                    >
                      GitHub →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-3xl border-2 border-emerald-200 bg-white p-6 shadow-md">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">Strengths</h3>
              {ev.strengths.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {ev.strengths.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm font-medium text-emerald-900">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lime-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-emerald-700">—</p>
              )}
            </section>
            <section className="rounded-3xl border-2 border-amber-200 bg-amber-50/80 p-6 shadow-md">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-800">Grow next</h3>
              {ev.improvements.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {ev.improvements.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm font-medium text-amber-950">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-amber-900">—</p>
              )}
            </section>
          </div>

          {ev.rubricBreakdown.length > 0 && (
            <section className="rounded-3xl border-2 border-emerald-200 bg-white p-6 shadow-md">
              <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700">Rubric</h3>
              <ul className="mt-4 divide-y divide-emerald-100">
                {ev.rubricBreakdown.map((row, i) => {
                  const pct = row.max > 0 ? row.score / row.max : 0;
                  return (
                    <li key={i} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-bold text-emerald-950">{row.criterion}</span>
                        <span className={`font-mono text-sm font-black ${scoreColor(row.score, row.max)}`}>
                          {row.score}/{row.max}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
                        <div
                          className={`h-full rounded-full ${pct >= 0.75 ? "bg-emerald-600" : pct >= 0.5 ? "bg-yellow-400" : "bg-orange-500"}`}
                          style={{ width: `${pct * 100}%` }}
                        />
                      </div>
                      {row.note && <p className="mt-1 text-xs font-medium text-emerald-700">{row.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="rounded-3xl border-2 border-emerald-200 bg-white p-8 text-center font-medium text-emerald-800">
          Evaluation not available.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/applicant/jobs/${jobId}`}
          className="rounded-xl border-2 border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-emerald-900"
        >
          Job details
        </Link>
        <Link
          href="/applicant/jobs"
          className="rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 px-5 py-2.5 text-sm font-black text-white shadow-lg"
        >
          Job board →
        </Link>
      </div>
    </div>
  );
}
