"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RubricEvaluation, StoredAssessment } from "../../../types";
import { LISTENER_ASSESSMENT_KEY } from "../../../types";

export function ResultsClient({
  jobId,
  applicantId,
}: {
  jobId: number;
  applicantId: number;
}) {
  const [data, setData] = useState<StoredAssessment | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LISTENER_ASSESSMENT_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as StoredAssessment;
      if (s.jobId !== jobId || s.applicantId !== applicantId) return;
      setData(s);
    } catch {
      setData(null);
    }
  }, [applicantId, jobId]);

  if (!data) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-400">
        No results in this browser session. Complete an assessment first.
        <div className="mt-4">
          <Link
            href={`/listener/jobs/${jobId}?applicantId=${applicantId}`}
            className="text-cyan-400 hover:text-cyan-300"
          >
            ← Job
          </Link>
        </div>
      </div>
    );
  }

  const ev: RubricEvaluation | null = data.evaluation;

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={`/listener/jobs?applicantId=${applicantId}`}
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Matched jobs
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-white">Assessment results</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {data.applicantName} · {data.job.title} · {data.job.company_name}
        </p>
        {data.submittedAt ? (
          <p className="mt-1 text-xs text-zinc-600">
            Submitted {new Date(data.submittedAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      {ev ? (
        <>
          <section className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:grid-cols-[1fr_200px] sm:items-center">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Overall
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300">{ev.summary}</p>
            </div>
            <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 py-6">
              <p className="text-xs font-medium uppercase tracking-wider text-cyan-200/80">
                Score
              </p>
              <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-cyan-300">
                {ev.overallScore}
                <span className="text-lg text-cyan-200/60">/{ev.maxScore}</span>
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold text-white">Strengths</h3>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-zinc-300">
                {(ev.strengths ?? []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold text-white">Improvements</h3>
              <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-zinc-300">
                {(ev.improvements ?? []).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </section>

          {ev.rubricBreakdown.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-sm font-semibold text-white">Rubric breakdown</h3>
              <ul className="mt-4 space-y-4">
                {ev.rubricBreakdown.map((row, i) => (
                  <li
                    key={i}
                    className="border-b border-white/5 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-zinc-200">{row.criterion}</span>
                      <span className="font-mono text-sm text-cyan-300/90">
                        {row.score}/{row.max}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{row.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-zinc-500">Evaluation not available.</p>
      )}
    </div>
  );
}
