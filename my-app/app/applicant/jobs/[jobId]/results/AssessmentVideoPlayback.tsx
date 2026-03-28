"use client";

import { useEffect, useState } from "react";
import { getAssessmentVideoSignedUrl } from "../../../actions";

export function AssessmentVideoPlayback({
  objectPath,
  interviewId,
}: {
  objectPath: string;
  interviewId: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getAssessmentVideoSignedUrl(objectPath, interviewId);
      if (cancelled) return;
      if ("url" in r) setUrl(r.url);
      else setErr(r.error);
    })();
    return () => {
      cancelled = true;
    };
  }, [objectPath, interviewId]);

  if (err) {
    return <p className="mt-2 text-xs text-amber-800">{err}</p>;
  }
  if (!url) {
    return <p className="mt-2 text-xs text-slate-500">Preparing video…</p>;
  }
  return (
    <video
      src={url}
      controls
      playsInline
      className="mt-2 max-h-56 w-full max-w-lg rounded-lg border border-slate-200 bg-black/5"
    />
  );
}
