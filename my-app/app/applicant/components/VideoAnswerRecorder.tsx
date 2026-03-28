"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "requesting" | "recording" | "recorded" | "error";

function pickMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return "video/webm";
}

export function VideoAnswerRecorder({
  questionId,
  onBlobChange,
  disabled,
}: {
  questionId: string;
  onBlobChange: (blob: Blob | null) => void;
  disabled: boolean;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const liveRef = useRef<HTMLVideoElement | null>(null);
  const playbackRef = useRef<HTMLVideoElement | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const resetRecording = useCallback(() => {
    stopTracks();
    recorderRef.current = null;
    chunksRef.current = [];
    onBlobChange(null);
    setStatus("idle");
    setError(null);
    if (playbackRef.current) {
      playbackRef.current.srcObject = null;
      playbackRef.current.removeAttribute("src");
    }
  }, [onBlobChange, stopTracks]);

  useEffect(() => {
    resetRecording();
  }, [questionId, resetRecording]);

  useEffect(() => {
    return () => {
      stopTracks();
    };
  }, [stopTracks]);

  const startRecording = async () => {
    setError(null);
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (liveRef.current) {
        liveRef.current.srcObject = stream;
        await liveRef.current.play().catch(() => {});
      }
      const mime = pickMimeType();
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime.split(";")[0] || "video/webm" });
        onBlobChange(blob);
        setStatus("recorded");
        stopTracks();
        if (liveRef.current) liveRef.current.srcObject = null;
        const url = URL.createObjectURL(blob);
        if (playbackRef.current) {
          playbackRef.current.src = url;
          playbackRef.current.onloadeddata = () => URL.revokeObjectURL(url);
        }
      };
      rec.start(200);
      setStatus("recording");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera/microphone access failed.";
      setError(msg);
      setStatus("error");
      stopTracks();
    }
  };

  const stopRecording = () => {
    const rec = recorderRef.current;
    if (rec && rec.state === "recording") {
      rec.stop();
    }
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Video answer</h3>
          <p className="text-xs text-zinc-500">
            Camera + mic. Your response is transcribed for grading (Whisper). Allow browser
            permissions when asked.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Live</p>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
            <video
              ref={liveRef}
              className="h-full w-full object-cover"
              muted
              playsInline
              autoPlay
            />
            {status === "recording" ? (
              <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                REC
              </span>
            ) : null}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Playback</p>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black ring-1 ring-white/10">
            <video ref={playbackRef} className="h-full w-full object-cover" playsInline controls />
          </div>
        </div>
      </div>

      {status === "requesting" ? (
        <p className="text-sm text-cyan-200/90">Starting camera…</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {status !== "recording" && status !== "requesting" ? (
          <button
            type="button"
            onClick={() => {
              if (status === "recorded") resetRecording();
              void startRecording();
            }}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#041018] transition hover:bg-zinc-200"
          >
            {status === "recorded" ? "Record again" : "Start recording"}
          </button>
        ) : null}
        {status === "recording" ? (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Stop
          </button>
        ) : null}
        {status === "recorded" ? (
          <button
            type="button"
            onClick={resetRecording}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5"
          >
            Discard & retake
          </button>
        ) : null}
      </div>
    </div>
  );
}
