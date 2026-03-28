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
    <form onSubmit={onSubmit} className="space-y-7">
      <p className="rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-50/90 to-white p-5 text-[13px] leading-relaxed text-slate-600 ring-1 ring-blue-500/5">
        <span className="font-semibold text-slate-900">GitHub</span> — for public repos we read the default
        branch tree, README, languages, and sample files. Add{" "}
        <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-800 shadow-sm">
          GITHUB_TOKEN
        </code>{" "}
        in{" "}
        <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] shadow-sm">.env.local</code> for
        higher API limits.
      </p>

      {error && (
        <div className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-800 transition-all duration-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-[13px] font-medium text-slate-700">Resume (PDF)</label>
        <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center transition-all duration-300 hover:border-blue-400/60 hover:bg-blue-50/40 hover:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
          <span className="text-2xl text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5">
            ↑
          </span>
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
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow duration-200 focus:border-blue-500/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
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
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow duration-200 focus:border-blue-500/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-[0.99] disabled:opacity-50 sm:w-auto sm:px-12"
      >
        {pending ? "Preparing assessment…" : "Continue to assessment"}
      </button>
    </form>
  );
}
