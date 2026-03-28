"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evaluateWithRubric, transcribeVideoAnswer } from "../../../actions";
import { VideoAnswerRecorder } from "../../../components/VideoAnswerRecorder";
import type { AssessmentQuestion, QuestionAnswerDetail, StoredAssessment } from "../../../types";
import { APPLICANT_ASSESSMENT_KEY } from "../../../types";

const LOCK_KEY = (jobId: number) => `talent_assessment_lock_${jobId}`;
/** Raw WebM size cap before we skip inline base64 (keeps DB row reasonable). */
const MAX_INLINE_VIDEO_BYTES = 900_000;

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const s = r.result as string;
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(blob);
  });
}

function loadStored(): StoredAssessment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(APPLICANT_ASSESSMENT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredAssessment;
    if (!Array.isArray(s.questionDetails)) s.questionDetails = [];
    return s;
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
    if (s.evaluation) {
      router.replace(`/applicant/jobs/${jobId}/results`);
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
    async (nextAnswers: Record<string, string>, questionDetails: QuestionAnswerDetail[]) => {
      if (!stored) return;
      setBusy(true);
      sessionStorage.removeItem(LOCK_KEY(jobId));
      const evaluation = await evaluateWithRubric({
        job: stored.job,
        generated: stored.generated,
        answers: nextAnswers,
        applicantId: stored.applicantId,
      });
      const final: StoredAssessment = {
        ...stored,
        answers: nextAnswers,
        questionDetails,
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

      const notes = text.trim();
      const blob = videoBlobRef.current;
      let videoTranscript = "";
      let videoBase64: string | null = null;
      let videoSkippedReason: string | null = null;
      const hadVideo = Boolean(blob && blob.size > 0);

      if (hadVideo && blob) {
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
          videoTranscript = "";
        } else {
          videoTranscript = r.text;
        }

        if (blob.size <= MAX_INLINE_VIDEO_BYTES) {
          try {
            videoBase64 = await blobToBase64(blob);
          } catch {
            videoSkippedReason = "Could not read video for storage.";
          }
        } else {
          videoSkippedReason = `Video larger than ${Math.round(MAX_INLINE_VIDEO_BYTES / 1000)}KB — transcript stored only.`;
        }
      }

      let combined = notes;
      if (videoTranscript) {
        combined = combined ? `${combined}\n\n[Video transcript]\n${videoTranscript}` : `[Video transcript]\n${videoTranscript}`;
      }
      if (!combined.trim()) {
        if (!auto) {
          setBanner("Record a video answer and/or type a response before submitting.");
          submitting.current = false;
          return;
        }
        combined = "[No response — time expired]";
      }

      const detail: QuestionAnswerDetail = {
        questionId: current.id,
        prompt: current.prompt,
        writtenNotes: notes,
        videoTranscript,
        hadVideoRecording: hadVideo,
        videoWebmBase64: videoBase64,
        videoSkippedReason,
        answeredAt: new Date().toISOString(),
      };

      const prevDetails = stored.questionDetails.filter((d) => d.questionId !== current.id);
      const questionDetails = [...prevDetails, detail];

      const nextAnswers = { ...stored.answers, [current.id]: combined };
      const next: StoredAssessment = { ...stored, answers: nextAnswers, questionDetails };
      saveStored(next);
      setStored(next);
      videoBlobRef.current = null;

      if (index >= questions.length - 1) {
        await finishAssessment(nextAnswers, questionDetails);
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
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-5 rounded-3xl border border-slate-200/90 bg-white/90 p-6 shadow-sm ring-1 ring-slate-900/[0.04] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600/90">Live assessment</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {stored.job.title}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {stored.job.company_name} · Question {index + 1} of {questions.length}
          </p>
        </div>
        <div className="w-full max-w-xs sm:w-52">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {banner ? (
        <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 to-amber-50/40 px-5 py-3.5 text-[13px] leading-relaxed text-amber-950 ring-1 ring-amber-500/10">
          {banner}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_70px_-32px_rgba(37,99,235,0.18)] ring-1 ring-slate-900/[0.04]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-blue-50/30 px-6 py-4">
          <p className="text-[13px] leading-relaxed text-slate-700">
            {phase === "prep"
              ? "Review the question. Preparation time before you answer."
              : "Record your response. You may add written notes. Video is transcribed and stored with your interview."}
          </p>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {current ? (
            <>
              <p className="text-base leading-relaxed text-slate-900 sm:text-lg">{current.prompt}</p>

              {phase === "prep" ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-blue-100/90 bg-gradient-to-b from-blue-50/80 to-white py-14 ring-1 ring-blue-500/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600/90">Prepare</p>
                  <p className="font-mono text-5xl font-semibold tabular-nums tracking-tight text-blue-700 transition-all duration-300">
                    {prepLeft}s
                  </p>
                  <p className="text-[13px] text-slate-500">Plan your answer before recording.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                    <span>Time remaining</span>
                    <span className="font-mono text-[13px] font-semibold normal-case tracking-normal tabular-nums text-blue-600">
                      {answerLeft}s
                    </span>
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
                      className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-shadow duration-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
                      placeholder="Additional context…"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={transcribing}
                      onClick={() => void goNext(draft, false)}
                      className="rounded-xl bg-gradient-to-b from-blue-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-all duration-200 hover:shadow-lg disabled:opacity-60"
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
