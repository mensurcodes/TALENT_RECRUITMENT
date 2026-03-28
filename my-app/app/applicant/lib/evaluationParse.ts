import type { RubricEvaluation } from "../types";

/** Parse evaluation JSON from DB / API. */
export function parseStoredEvaluation(raw: unknown): RubricEvaluation | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.overallScore !== "number" || typeof o.summary !== "string") return null;
  const rubricRaw = o.rubricBreakdown;
  const rubricBreakdown = Array.isArray(rubricRaw)
    ? rubricRaw
        .map((row) => {
          const r = row as Record<string, unknown>;
          return {
            criterion: String(r.criterion ?? ""),
            score: typeof r.score === "number" ? r.score : 0,
            max: typeof r.max === "number" ? r.max : 0,
            note: typeof r.note === "string" ? r.note : "",
          };
        })
        .filter((r) => r.criterion)
    : [];
  return {
    overallScore: o.overallScore,
    maxScore: typeof o.maxScore === "number" ? o.maxScore : 100,
    summary: o.summary,
    strengths: Array.isArray(o.strengths) ? o.strengths.map((s) => String(s)) : [],
    improvements: Array.isArray(o.improvements) ? o.improvements.map((s) => String(s)) : [],
    rubricBreakdown,
  };
}

/** Headline weak areas for cards and PDF (improvements + lowest rubric rows). */
export function deriveWeakestPoints(ev: RubricEvaluation): string[] {
  const out: string[] = [...ev.improvements.filter(Boolean)];
  const sorted = [...ev.rubricBreakdown].sort((a, b) => {
    const ra = a.max > 0 ? a.score / a.max : 1;
    const rb = b.max > 0 ? b.score / b.max : 1;
    return ra - rb;
  });
  for (const row of sorted) {
    if (row.max > 0 && row.score / row.max < 0.7) {
      const line = row.note?.trim()
        ? `${row.criterion}: ${row.note}`
        : `${row.criterion} (${row.score}/${row.max})`;
      out.push(line);
    }
  }
  return [...new Set(out.map((s) => s.trim()))].filter(Boolean).slice(0, 6);
}
