"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { buildAssessmentFromApplyForm } from "../../../actions";
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
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function persistAndGo(payload: StoredAssessment) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(APPLICANT_ASSESSMENT_KEY, JSON.stringify(payload));
    router.push(`/applicant/jobs/${job.id}/assessment`);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file && !resumeUrl.trim()) {
      setError("Upload a PDF resume or enter a resume URL.");
      return;
    }
    if (!githubUrl.trim()) {
      setError("GitHub repository URL is required.");
      return;
    }

    const fd = new FormData();
    fd.set("jobId", String(job.id));
    fd.set("githubUrl", githubUrl.trim());
    if (resumeUrl.trim()) fd.set("resumeUrl", resumeUrl.trim());
    if (file) fd.set("resumePdf", file);

    startTransition(async () => {
      const res = await buildAssessmentFromApplyForm(fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const stored: StoredAssessment = {
        jobId: job.id,
        applicantId: applicant.id,
        applicantName: applicant.name,
        job: res.job,
        resumeUrl: res.resumeLabel,
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

      <input type="hidden" name="jobId" value={job.id} readOnly />

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Resume (PDF upload)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileName(f ? f.name : null);
          }}
          className="block w-full cursor-pointer text-sm text-zinc-300 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-cyan-200 hover:file:bg-cyan-500/30"
        />
        {fileName ? (
          <p className="text-xs text-cyan-400/90">Selected: {fileName}</p>
        ) : (
          <p className="text-xs text-zinc-500">Choose a PDF from your computer (max 8MB).</p>
        )}
      </div>

      <div className="relative py-2 text-center text-xs text-zinc-600 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-white/10">
        <span className="relative bg-[#050912] px-3">or use a link instead</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Resume URL (optional if you uploaded a PDF)
        </label>
        <input
          type="url"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none ring-cyan-500/40 placeholder:text-zinc-600 focus:ring-2"
        />
        <p className="text-xs text-zinc-500">Public HTML/text link if you prefer not to upload.</p>
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
