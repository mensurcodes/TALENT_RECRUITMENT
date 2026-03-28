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
        if (res.error === "ALREADY_APPLIED") {
          router.push(`/applicant/jobs/${job.id}/results`);
          return;
        }
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
      <p className="rounded-lg border border-blue-100 bg-blue-50/80 p-4 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">GitHub:</span> for public repositories we analyze
        the default branch tree, README, languages, and sample source files via the GitHub API. Add{" "}
        <code className="rounded bg-white px-1 font-mono text-xs text-slate-800">GITHUB_TOKEN</code> to{" "}
        <code className="rounded bg-white px-1 font-mono text-xs">.env.local</code> for higher rate limits.
      </p>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Resume (PDF)</label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-300 hover:bg-blue-50/30">
          <span className="text-2xl text-slate-400">↑</span>
          {fileName ? (
            <span className="text-sm font-medium text-slate-900">{fileName}</span>
          ) : (
            <>
              <span className="text-sm font-medium text-slate-700">Click to upload or drag PDF</span>
              <span className="text-xs text-slate-500">Maximum 8 MB</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setFileName(f ? f.name : null);
            }}
          />
        </label>
      </div>

      <div className="relative text-center text-xs text-slate-400">
        <span className="relative z-10 bg-white px-2">or</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Resume URL <span className="font-normal text-slate-500">(optional if uploading PDF)</span>
        </label>
        <input
          type="url"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          GitHub repository <span className="text-red-600">*</span>
        </label>
        <input
          type="url"
          required
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/org/repo"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {pending ? "Preparing assessment…" : "Continue to assessment"}
      </button>
    </form>
  );
}
