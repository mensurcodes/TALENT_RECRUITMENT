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
      <p className="rounded-2xl border-2 border-lime-200 bg-lime-50 p-4 text-sm font-medium text-emerald-900">
        <strong className="text-emerald-950">Live GitHub scan:</strong> for public repos we pull the
        default branch file tree, README, language stats, and excerpts from key source files (via the
        GitHub API). Set <code className="rounded bg-white px-1 font-mono text-xs">GITHUB_TOKEN</code>{" "}
        in <code className="rounded bg-white px-1 font-mono text-xs">.env.local</code> for higher rate
        limits.
      </p>

      {error && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-emerald-700">
          Resume — PDF
        </label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-lime-400 bg-gradient-to-b from-yellow-50 to-lime-50 px-6 py-10 text-center transition hover:border-emerald-500">
          <span className="text-3xl">📄</span>
          {fileName ? (
            <span className="font-bold text-emerald-950">{fileName}</span>
          ) : (
            <>
              <span className="font-bold text-emerald-900">
                Drop PDF here or <span className="text-lime-700 underline">browse</span>
              </span>
              <span className="text-xs font-medium text-emerald-700">Max 8MB</span>
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

      <div className="relative text-center text-xs font-bold text-emerald-600">
        <span className="relative z-10 bg-white px-3">or resume URL</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-emerald-200" />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-emerald-700">
          Resume link <span className="font-normal normal-case text-emerald-600">(optional)</span>
        </label>
        <input
          type="url"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-xl border-2 border-emerald-100 bg-lime-50/40 px-4 py-3 text-emerald-950 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-black uppercase tracking-widest text-emerald-700">
          GitHub repo <span className="text-red-600">*</span>
        </label>
        <input
          type="url"
          required
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/org/repo"
          className="w-full rounded-xl border-2 border-emerald-100 bg-lime-50/40 px-4 py-3 text-emerald-950 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-200"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-600 py-4 text-base font-black text-white shadow-lg disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {pending ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Building assessment…
          </>
        ) : (
          "Submit & continue →"
        )}
      </button>
    </form>
  );
}
