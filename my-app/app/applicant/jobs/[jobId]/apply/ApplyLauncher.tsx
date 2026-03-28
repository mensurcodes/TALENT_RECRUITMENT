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
  const [consentGithubAssessment, setConsentGithubAssessment] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function persistAndGo(payload: StoredAssessment) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(APPLICANT_ASSESSMENT_KEY, JSON.stringify(payload));
    router.push(`/applicant/jobs/${job.id}/assessment`);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setTouchedSubmit(true);

    const file = fileRef.current?.files?.[0];
    if (!file && !resumeUrl.trim()) {
      setError("Upload a PDF resume or enter a resume URL.");
      return;
    }
    if (!githubUrl.trim()) {
      setError("GitHub repository or profile URL is required.");
      return;
    }
    if (!consentGithubAssessment) {
      setError("Please confirm the authorization below to continue.");
      return;
    }

    const fd = new FormData();
    fd.set("jobId", String(job.id));
    fd.set("githubUrl", githubUrl.trim());
    fd.set("consentGithubAssessment", "true");
    if (resumeUrl.trim()) fd.set("resumeUrl", resumeUrl.trim());
    if (file) fd.set("resumePdf", file);

    startTransition(async () => {
      const res = await buildAssessmentFromApplyForm(fd);
      if ("error" in res) {
        if (res.error === "ALREADY_APPLIED") {
          router.push(`/applicant/jobs/${job.id}`);
          return;
        }
        setError(res.error);
        return;
      }
      const stored: StoredAssessment = {
        interviewId: res.interviewId,
        jobId: job.id,
        applicantId: applicant.id,
        applicantName: applicant.name,
        job: res.job,
        resumeUrl: res.resumeLabel,
        githubUrl: githubUrl.trim(),
        generated: res.generated,
        answers: {},
        questionDetails: [],
        evaluation: null,
        submittedAt: null,
      };
      persistAndGo(stored);
    });
  }

  const consentInvalid = touchedSubmit && !consentGithubAssessment;

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-8"
      noValidate
      aria-describedby={error ? "apply-form-error" : undefined}
    >
      <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm ring-1 ring-slate-900/[0.03] backdrop-blur-sm sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600/90">How this step works</p>
        <p className="mt-3 text-[13px] leading-relaxed text-slate-600">
          We use your <strong className="font-semibold text-slate-800">resume</strong> and the{" "}
          <strong className="font-semibold text-slate-800">GitHub URL</strong> you provide (repository or profile) to
          fetch public repository metadata and code excerpts via GitHub&apos;s API — the same information visible on
          GitHub when repos are public, or what your optional{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">GITHUB_TOKEN</code> can access.
          That context, together with your resume, generates <strong className="text-slate-800">five</strong> timed
          interview questions. Your video answers and transcripts may be stored for the employer to review. Nothing
          runs until you confirm authorization below.
        </p>
      </div>

      {error ? (
        <div
          id="apply-form-error"
          role="alert"
          className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-800 transition-all duration-200"
        >
          {error}
        </div>
      ) : null}

      <fieldset className="space-y-3 border-0 p-0">
        <legend className="text-[13px] font-medium text-slate-700">
          Resume <span className="text-red-600">*</span>{" "}
          <span className="font-normal text-slate-500">PDF upload or URL</span>
        </legend>
        <label className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center transition-all duration-300 hover:border-blue-400/60 hover:bg-blue-50/40 hover:shadow-[0_0_0_4px_rgba(59,130,246,0.08)]">
          <span className="text-2xl text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5">
            ↑
          </span>
          {fileName ? (
            <span className="text-sm font-medium text-slate-900">{fileName}</span>
          ) : (
            <>
              <span className="text-sm font-medium text-slate-700">Click to upload PDF (max 8 MB)</span>
              <span className="text-xs text-slate-500">Or enter a resume URL below</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            aria-label="Resume PDF file"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              setFileName(f ? f.name : null);
            }}
          />
        </label>
      </fieldset>

      <div className="relative text-center text-xs text-slate-400">
        <span className="relative z-10 bg-white px-2">or</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" aria-hidden />
      </div>

      <div className="space-y-2">
        <label htmlFor="apply-resume-url" className="block text-sm font-medium text-slate-700">
          Resume URL <span className="font-normal text-slate-500">(if not uploading PDF)</span>
        </label>
        <input
          id="apply-resume-url"
          type="url"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://…"
          autoComplete="url"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow duration-200 focus:border-blue-500/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="apply-github-url" className="block text-sm font-medium text-slate-700">
          GitHub repository or profile <span className="text-red-600">*</span>
        </label>
        <input
          id="apply-github-url"
          type="url"
          required
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/you or https://github.com/you/a-repo"
          autoComplete="url"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow duration-200 focus:border-blue-500/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
        />
        <p className="text-xs leading-relaxed text-slate-500">
          Public repos are read via GitHub&apos;s API. For private repos or higher rate limits, the project may use a
          server-side token — never your password.
        </p>
      </div>

      <div
        className={`rounded-2xl border px-4 py-4 transition-colors sm:px-5 sm:py-5 ${
          consentInvalid
            ? "border-amber-300/90 bg-amber-50/80 ring-2 ring-amber-400/30"
            : "border-slate-200/90 bg-slate-50/60 ring-1 ring-slate-900/[0.04]"
        }`}
      >
        <div className="flex gap-3">
          <input
            id="consent-github-assessment"
            type="checkbox"
            checked={consentGithubAssessment}
            onChange={(e) => {
              setConsentGithubAssessment(e.target.checked);
              if (e.target.checked) setError(null);
            }}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
            aria-invalid={consentInvalid}
            aria-describedby="consent-github-assessment-desc"
          />
          <div className="min-w-0">
            <label htmlFor="consent-github-assessment" className="text-[13px] font-semibold text-slate-900">
              I authorize access and use for this application{" "}
              <span className="text-red-600" aria-hidden>
                *
              </span>
            </label>
            <p id="consent-github-assessment-desc" className="mt-2 text-[13px] leading-relaxed text-slate-600">
              I confirm I am entitled to share the GitHub URL and resume I provide. I authorize Talent to retrieve
              information from GitHub (including public repository metadata, file trees, READMEs, and limited source
              excerpts, and any additional access allowed by a project-configured token) and to read my resume. I
              understand this information will be used <strong className="font-medium text-slate-800">only</strong> to
              generate and evaluate my skills assessment for <strong className="font-medium text-slate-800">{job.title}</strong>{" "}
              at <strong className="font-medium text-slate-800">{job.company_name}</strong>, and that my answers (including
              optional video recordings, transcripts, and notes) may be stored and reviewed by the employer as part of this
              application. I may withdraw before starting the timed assessment by leaving the application flow.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] text-slate-500">
          By continuing you start a locked assessment. Complete it in one session.
        </p>
        <button
          type="submit"
          disabled={pending || !consentGithubAssessment}
          className="w-full rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45 sm:w-auto sm:min-w-[200px] sm:px-10"
        >
          {pending ? "Preparing assessment…" : "Continue to assessment"}
        </button>
      </div>
    </form>
  );
}
