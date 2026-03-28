import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getApplicantSessionId } from "@/app/applicant/lib/auth";
import { getSupabase, hasSupabaseConfig } from "@/app/applicant/lib/supabase";
import {
  getLocalAssessmentVideoRoot,
  resolveLocalVideoFile,
} from "@/app/applicant/lib/localAssessmentVideos";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const applicantId = await getApplicantSessionId();
  if (!applicantId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const interviewId = Number(searchParams.get("interviewId"));
  const objectPath = searchParams.get("path") ?? "";
  if (!Number.isFinite(interviewId) || interviewId <= 0 || !objectPath) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const prefix = `${interviewId}/`;
  if (!objectPath.startsWith(prefix) || objectPath.includes("..")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!hasSupabaseConfig()) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const sb = getSupabase();
  const { data: row } = await sb
    .from("interviews")
    .select("applicant_id")
    .eq("id", interviewId)
    .maybeSingle();
  if (!row || row.applicant_id !== applicantId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const root = getLocalAssessmentVideoRoot();
  if (!root) {
    return new NextResponse("Not found", { status: 404 });
  }

  let full: string;
  try {
    full = resolveLocalVideoFile(root, objectPath);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    await stat(full);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const nodeStream = createReadStream(full);
  const webStream = Readable.toWeb(nodeStream);
  return new NextResponse(webStream as unknown as BodyInit, {
    headers: {
      "Content-Type": "video/webm",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
