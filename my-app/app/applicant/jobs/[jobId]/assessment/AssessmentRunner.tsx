"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evaluateWithRubric, transcribeVideoAnswer } from "../../../actions";
import { VideoAnswerRecorder } from "../../../components/VideoAnswerRecorder";
import type { AssessmentQuestion, StoredAssessment } from "../../../types";
import { APPLICANT_ASSESSMENT_KEY } from "../../../types";

function loadStored(): StoredAssessment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(APPLICANT_ASSESSMENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAssessment;
  } catch {
    return null;
  }
}

function saveStored(s: StoredAssessment) {
  sessionStorage.setItem(APPLICANT_ASSESSMENT_KEY, JSON.stringify(s));
}

export function AssessmentRunner({
  jobId,
  applicantId,
}: {
  jobId: number;
  applicantId: number;
}) {
  const router = useRouter();
  const [stored, setStored] = useState<StoredAssessment | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"prep" | "answer">("prep");
  const [prepLeft, setPrepLeft] = useState(0);
  const [answerLeft, setAnswerLeft] = useState(0);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const submitting = useRef(false);
  const draftRef = useRef("");
  draftRef.current = draft;
  const videoBlobRef = useRef<Blob | null>(null);

  const goNextRef = useRef<(text: string, auto: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    const s = loadStored();
    if (!s || s.jobId !== jobId || s.applicantId !== applicantId) {
      router.replace(`/applicant/jobs/${jobId}/apply`);
      return;
    }
    setStored(s);
    setHydrated(true);
  }, [applicantId, jobId, router]);

  const questions = stored?.generated.questions ?? [];
  const current: AssessmentQuestion | undefined = questions[index];

  useEffect(() => {
    if (!current) return;
    setPhase("prep");
    setPrepLeft(current.prepSeconds);
    setAnswerLeft(current.answerSeconds);
    setDraft(stored?.answers[current.id] ?? "");
    setBanner(null);
    videoBlobRef.current = null;
  }, [index, current?.id, stored]);

  useEffect(() => {
    if (!hydrated || !current || phase !== "prep") return;
    const id = window.setInterval(() => {
      setPrepLeft((p) => {
        if (p <= 1) {
          window.clearInterval(id);
          queueMicrotask(() => setPhase("answer"));
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [hydrated, phase, current?.id]);

  const finishAssessment = useCallback(
    async (nextAnswers: Record<string, string>) => {
      if (!stored) return;
      setBusy(true);
      const evaluation = await evaluateWithRubric({
        job: stored.job,
        generated: stored.generated,
        answers: nextAnswers,
        applicantId: stored.applicantId,
      });
      const final: StoredAssessment = {
        ...stored,
        answers: nextAnswers,
        evaluation,
        submittedAt: new Date().toISOString(),
      };
      saveStored(final);
      setStored(final);
      setBusy(false);
      router.replace(`/applicant/jobs/${jobId}/results`);
    },
    [applicantId, jobId, router, stored],
  );

  const goNext = useCallback(
    async (text: string, auto: boolean) => {
      if (!stored || !current || submitting.current) return;
      submitting.current = true;
      setBanner(null);

      let finalText = text.trim();
      const blob = videoBlobRef.current;

      if (blob && blob.size > 0) {
        setTranscribing(true);
        const fd = new FormData();
        fd.append("file", blob, "answer.webm");
        const r = await transcribeVideoAnswer(fd);
        setTranscribing(false);

        if ("error" in r) {
          if (!auto) {
            setBanner(r.error);
            submitting.current = false;
            return;
          }
          if (!finalText) finalText = "[No response — time expired]";
        } else {
          const trans = r.text;
          finalText = finalText
            ? `${finalText}\n\n[Video transcript]\n${trans}`
            : `[Video transcript]\n${trans}`;
        }
      }

      if (!finalText.trim()) {
        if (!auto) {
          setBanner("Record a video answer and/or type a response before submitting.");
          submitting.current = false;
          return;
        }
        finalText = "[No response — time expired]";
      }

      const nextAnswers = { ...stored.answers, [current.id]: finalText };
      const next: StoredAssessment = { ...stored, answers: nextAnswers };
      saveStored(next);
      setStored(next);
      videoBlobRef.current = null;

      if (index >= questions.length - 1) {
        await finishAssessment(nextAnswers);
        submitting.current = false;
        return;
      }

      setIndex((i) => i + 1);
      submitting.current = false;
    },
    [current, finishAssessment, index, questions.length, stored],
  );

  goNextRef.current = goNext;

  useEffect(() => {
    if (!hydrated || !current || phase !== "answer") return;
    const id = window.setInterval(() => {
      setAnswerLeft((p) => {
        if (p <= 1) {
          window.clearInterval(id);
          queueMicrotask(() => void goNextRef.current(draftRef.current, true));
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [hydrated, phase, current?.id]);

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round((index / questions.length) * 100);
  }, [index, questions.length]);

  const onVideoBlob = useCallback((b: Blob | null) => {
    videoBlobRef.current = b;
  }, []);

  if (!hydrated || !stored) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-600">
        Loading assessment…
      </div>
    );
  }

  if (busy) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="text-sm text-slate-600">Scoring with recruiter rubric…</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Assessment</p>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{stored.job.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {stored.job.company_name} · Question {index + 1} of {questions.length}
          </p>
        </div>
        <div className="w-full max-w-xs sm:w-48">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {banner ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {banner}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-sm text-slate-700">
            {phase === "prep"
              ? "Review the question. Preparation time before you answer."
              : "Record your response. You may add written notes. Video is transcribed for grading."}
          </p>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {current ? (
            <>
              <p className="text-base leading-relaxed text-slate-900 sm:text-lg">{current.prompt}</p>

              {phase === "prep" ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 py-12">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Preparation</p>
                  <p className="font-mono text-4xl font-semibold tabular-nums text-blue-900">{prepLeft}s</p>
                  <p className="text-xs text-slate-600">Time to plan your answer.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Time remaining</span>
                    <span className="font-mono tabular-nums text-blue-700">{answerLeft}s</span>
                  </div>

                  {current ? (
                    <VideoAnswerRecorder
                      key={current.id}
                      questionId={current.id}
                      onBlobChange={onVideoBlob}
                      disabled={false}
                    />
                  ) : null}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Written notes (optional)</label>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={5}
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Additional context…"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={transcribing}
                      onClick={() => void goNext(draft, false)}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {transcribing ? "Transcribing…" : "Submit answer"}
                    </button>
                    {transcribing ? <span className="text-xs text-slate-500">Processing audio…</span> : null}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600">No questions were generated.</p>
          )}
        </div>
      </div>
    </div>
  );
}
