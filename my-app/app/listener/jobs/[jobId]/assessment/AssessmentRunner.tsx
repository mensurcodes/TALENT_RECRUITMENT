"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { evaluateWithRubric } from "../../../actions";
import type { AssessmentQuestion, StoredAssessment } from "../../../types";
import { LISTENER_ASSESSMENT_KEY } from "../../../types";

function loadStored(): StoredAssessment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LISTENER_ASSESSMENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAssessment;
  } catch {
    return null;
  }
}

function saveStored(s: StoredAssessment) {
  sessionStorage.setItem(LISTENER_ASSESSMENT_KEY, JSON.stringify(s));
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
  const [banner, setBanner] = useState<string | null>(null);
  const submitting = useRef(false);
  const draftRef = useRef("");
  draftRef.current = draft;

  const goNextRef = useRef<(text: string, auto: boolean) => Promise<void>>(async () => {});

  useEffect(() => {
    const s = loadStored();
    if (!s || s.jobId !== jobId || s.applicantId !== applicantId) {
      router.replace(`/listener/jobs/${jobId}/apply?applicantId=${applicantId}`);
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
      router.replace(`/listener/jobs/${jobId}/results?applicantId=${applicantId}`);
    },
    [applicantId, jobId, router, stored],
  );

  const goNext = useCallback(
    async (text: string, auto: boolean) => {
      if (!stored || !current || submitting.current) return;
      const trimmed = text.trim();
      if (!trimmed && !auto) {
        setBanner("Write something before submitting, or wait for the timer to auto-submit.");
        return;
      }
      submitting.current = true;
      const nextAnswers = { ...stored.answers, [current.id]: trimmed };
      const next: StoredAssessment = { ...stored, answers: nextAnswers };
      saveStored(next);
      setStored(next);
      setBanner(null);

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

  if (!hydrated || !stored) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        Loading assessment…
      </div>
    );
  }

  if (busy) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-sm text-zinc-400">Scoring with recruiter rubric…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400/90">
            Timed assessment
          </p>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">{stored.job.title}</h1>
          <p className="text-sm text-zinc-500">
            {stored.job.company_name} · Question {index + 1} of {questions.length}
          </p>
        </div>
        <div className="w-full max-w-xs sm:w-48">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {banner ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {banner}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050912] shadow-[0_0_80px_-20px_rgba(34,211,238,0.35)]">
        <div className="border-b border-white/10 bg-black/40 px-5 py-3">
          <p className="text-xs text-zinc-500">
            {phase === "prep"
              ? "Read the prompt. Think before the answer window opens."
              : "Answer window — reference your resume or repository when it strengthens your response."}
          </p>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          {current ? (
            <>
              <p className="text-base leading-relaxed text-zinc-100 sm:text-lg">{current.prompt}</p>

              {phase === "prep" ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 py-12">
                  <p className="text-sm font-medium text-cyan-100/90">Think time</p>
                  <p className="font-mono text-4xl font-semibold tabular-nums text-cyan-300">
                    {prepLeft}s
                  </p>
                  <p className="text-xs text-zinc-500">Prep period before you can type (HackerRank-style).</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Your answer</span>
                    <span className="font-mono tabular-nums text-cyan-300/90">{answerLeft}s left</span>
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={10}
                    className="w-full resize-y rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm leading-relaxed text-zinc-100 outline-none ring-cyan-500/30 focus:ring-2"
                    placeholder="Type your response…"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void goNext(draft, false)}
                      className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-[#041018] transition hover:bg-cyan-400"
                    >
                      Submit answer
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-500">No questions were generated.</p>
          )}
        </div>
      </div>
    </div>
  );
}
