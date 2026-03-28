"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { buildAssessmentPayload } from "../../../actions";
import type { ApplicantRow, JobRow } from "../../../types";
import { APPLICANT_ASSESSMENT_KEY, type StoredAssessment } from "../../../types";

type Props = {
  job: JobRow;
  applicant: ApplicantRow;
};

export function ApplyLauncher({ job, applicant }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState(applicant.resume_url ?? "");
  const [githubUrl, setGithubUrl] = useState(applicant.github_url ?? "");

  function persistAndGo(payload: StoredAssessment) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(APPLICANT_ASSESSMENT_KEY, JSON.stringify(payload));
    router.push(`/applicant/jobs/${job.id}/assessment`);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!resumeUrl.trim() || !githubUrl.trim()) {
      setError("Resume URL and GitHub URL are required to ingest context.");
      return;
    }
    startTransition(async () => {
      const res = await buildAssessmentPayload(job.id, applicant.id, resumeUrl.trim(), githubUrl.trim());
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const stored: StoredAssessment = {
        jobId: job.id,
        applicantId: applicant.id,
        applicantName: applicant.name,
        job: res.job,
        resumeUrl: resumeUrl.trim(),
        githubUrl: githubUrl.trim(),
        generated: res.generated,
        answers: {},
        evaluation: null,
        submittedAt: null,
      };
      persistAndGo(stored);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Resume URL
        </label>
        <input
          type="url"
          required
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-cyan-500/40 placeholder:text-zinc-600 focus:ring-2"
        />
        <p className="text-xs text-zinc-500">
          Public link (HTML or text works best in demo mode; PDFs are noted to the model only).
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          GitHub repository
        </label>
        <input
          type="url"
          required
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/org/repo"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-cyan-500/40 placeholder:text-zinc-600 focus:ring-2"
        />
        <p className="text-xs text-zinc-500">
          Public repos ingest README + metadata. Optional: set{" "}
          <code className="text-zinc-400">GITHUB_TOKEN</code> for higher rate limits.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Ingesting & generating questions…" : "Submit application & begin assessment"}
        </button>
      </div>
    </form>
  );
}
