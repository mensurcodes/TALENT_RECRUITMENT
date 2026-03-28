"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { APPLICANT_ASSESSMENT_KEY, type StoredAssessment } from "../../../types";

const LOCK_PREFIX = "talent_assessment_lock_";

export function clearAssessmentForJob(jobId: number) {
  try {
    const raw = sessionStorage.getItem(APPLICANT_ASSESSMENT_KEY);
    if (raw) {
      const s = JSON.parse(raw) as StoredAssessment;
      if (s.jobId === jobId) sessionStorage.removeItem(APPLICANT_ASSESSMENT_KEY);
    }
  } catch {
    sessionStorage.removeItem(APPLICANT_ASSESSMENT_KEY);
  }
  sessionStorage.removeItem(`${LOCK_PREFIX}${jobId}`);
}

/**
 * Once the assessment route is active: browser back / in-app nav away cancels the attempt;
 * beforeunload warns on refresh/close; header links require confirm.
 */
export function AssessmentLock({ jobId }: { jobId: number }) {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem(`${LOCK_PREFIX}${jobId}`, "1");

    const cancelAndExit = () => {
      clearAssessmentForJob(jobId);
      router.replace(`/applicant/jobs/${jobId}/apply?assessment=cancelled`);
    };

    const onPopState = () => {
      cancelAndExit();
    };
    window.addEventListener("popstate", onPopState);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const raw = sessionStorage.getItem(APPLICANT_ASSESSMENT_KEY);
      if (!raw) return;
      try {
        const s = JSON.parse(raw) as StoredAssessment;
        if (s.jobId !== jobId || s.evaluation) return;
      } catch {
        return;
      }
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    const onClickCapture = (e: MouseEvent) => {
      const raw = sessionStorage.getItem(APPLICANT_ASSESSMENT_KEY);
      if (!raw) return;
      try {
        const s = JSON.parse(raw) as StoredAssessment;
        if (s.jobId !== jobId || s.evaluation) return;
      } catch {
        return;
      }

      const el = e.target as HTMLElement | null;
      const a = el?.closest("a[href]");
      if (!a) return;
      const href = (a as HTMLAnchorElement).getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let path: string;
      try {
        path = new URL(href, window.location.origin).pathname;
      } catch {
        return;
      }
      const assessmentPath = `/applicant/jobs/${jobId}/assessment`;
      if (path === assessmentPath) return;

      e.preventDefault();
      e.stopPropagation();
      const ok = window.confirm(
        "Leaving this page ends your assessment. Your progress will not be saved. Continue?",
      );
      if (!ok) return;
      clearAssessmentForJob(jobId);
      const abs = new URL(href, window.location.origin).href;
      window.location.assign(abs);
    };
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [jobId, router]);

  return (
    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-[13px] leading-relaxed text-amber-950 ring-1 ring-amber-500/15">
      <p className="font-semibold text-amber-950">Assessment lock</p>
      <p className="mt-1 text-amber-900/90">
        Do not use the browser Back button or leave this page — your attempt will be cancelled. Finish all questions
        to submit.
      </p>
    </div>
  );
}
