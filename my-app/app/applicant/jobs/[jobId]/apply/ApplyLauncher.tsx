"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

  function persistAndGo(payload: StoredAssessment) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(APPLICANT_ASSESSMENT_KEY, JSON.stringify(payload));
    router.push(`/applicant/jobs/${job.id}/assessment`);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!githubUrl.trim()) {
      setError("GitHub repository URL is required.");
      return;
    }

    const fd = new FormData();
    fd.set("jobId", String(job.id));
    fd.set("githubUrl", githubUrl.trim());
    if (resumeUrl.trim()) fd.set("resumeUrl", resumeUrl.trim());

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
        <span className="font-semibold text-slate-900">GitHub</span> — paste a{" "}
        <strong className="font-semibold text-slate-800">repository</strong> URL or your{" "}
        <strong className="font-semibold text-slate-800">profile</strong> URL (we scan up to five recently updated{" "}
        <em>public</em> repos). We load default-branch trees, READMEs, languages, and sample files. Add{" "}
        <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-800 shadow-sm">
          GITHUB_TOKEN
        </code>{" "}
        to{" "}
        <code className="rounded-md bg-white px-1.5 py-0.5 font-mono text-[11px] shadow-sm">.env.local</code> for
        higher limits or private repos your token can read. Optional resume link below is stored for scoring only —
        questions use this GitHub context only.
      </p>

      {error && (
        <div className="rounded-xl border border-red-200/90 bg-red-50 px-4 py-3 text-sm text-red-800 transition-all duration-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          GitHub repository <span className="text-red-600">*</span>
        </label>
        <input
          type="url"
          required
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/you or https://github.com/you/a-repo"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow duration-200 focus:border-blue-500/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Resume link{" "}
          <span className="font-normal text-slate-500">(optional — HTML/text pages only; no PDF upload for now)</span>
        </label>
        <input
          type="url"
          value={resumeUrl}
          onChange={(e) => setResumeUrl(e.target.value)}
          placeholder="https://… (optional)"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition-shadow duration-200 focus:border-blue-500/80 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
        />
        <p className="text-xs text-slate-500">
          Assessment questions are generated from the repo only. This link is stored for your record and grading; it is not used to draft questions.
        </p>
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
