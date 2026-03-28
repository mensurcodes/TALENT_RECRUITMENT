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
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* PDF upload */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Resume — PDF upload
        </label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-8 text-center transition hover:border-cyan-500/40 hover:bg-white/[0.04]">
          <svg className="h-7 w-7 text-zinc-600" viewBox="0 0 24 24" fill="none">
            <path d="M12 16V8m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 16.5A3.5 3.5 0 0 0 16.5 13H15a5 5 0 1 0-9.9 1A4 4 0 0 0 7 21h12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {fileName ? (
            <span className="text-sm font-medium text-cyan-300">{fileName}</span>
          ) : (
            <>
              <span className="text-sm text-zinc-400">
                <span className="font-medium text-zinc-200">Click to upload</span> or drag and drop
              </span>
              <span className="text-xs text-zinc-600">PDF only · max 8MB</span>
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

      {/* Divider */}
      <div className="relative text-center text-xs text-zinc-700 before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-white/8">
        <span className="relative bg-[#070b14] px-3">or provide a link instead</span>
      </div>

      {/* Resume URL */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Resume URL
          <span className="ml-1.5 font-normal normal-case text-zinc-700">optional if uploading PDF</span>
        </label>
        <input
          type="url"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-cyan-500/40 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-1"
        />
      </div>

      {/* GitHub */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-zinc-500">
          GitHub repository
          <span className="ml-1.5 font-normal normal-case text-zinc-700">required</span>
        </label>
        <input
          type="url"
          required
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/username/repo"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-cyan-500/40 placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-1"
        />
        <p className="text-xs text-zinc-600">
          Public repo — we ingest README and metadata to tailor assessment questions.
        </p>
      </div>

      <div className="pt-1">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#041018]/30 border-t-[#041018]" />
              Generating assessment…
            </>
          ) : (
            "Submit & start assessment →"
          )}
        </button>
        <p className="mt-2 text-xs text-zinc-600">
          This will generate 3–5 questions tailored to this role and your experience.
        </p>
      </div>
    </form>
  );
}
