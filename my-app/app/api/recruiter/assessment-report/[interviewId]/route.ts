import { NextResponse } from "next/server";
import { getSupabase, hasSupabaseConfig } from "@/app/applicant/lib/supabase";
import { buildAssessmentReportPdf } from "@/app/applicant/lib/assessmentPdf";
import { parseStoredEvaluation } from "@/app/applicant/lib/evaluationParse";
import { getRecruiterSessionId } from "@/app/recruiter/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ interviewId: string }> },
) {
  const recruiterId = await getRecruiterSessionId();
  if (!recruiterId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { interviewId: raw } = await context.params;
  const interviewId = Number(raw);
  if (!Number.isFinite(interviewId) || interviewId <= 0) {
    return new NextResponse("Bad request", { status: 400 });
  }

  if (!hasSupabaseConfig()) {
    return new NextResponse("Not configured", { status: 503 });
  }

  const sb = getSupabase();

  const { data: inv, error: invErr } = await sb
    .from("interviews")
    .select("id,job_id,applicant_name,recruiter_name,submitted_at,evaluation")
    .eq("id", interviewId)
    .maybeSingle();

  if (invErr || !inv) {
    return new NextResponse("Not found", { status: 404 });
  }

  const row = inv as {
    id: number;
    job_id: number;
    applicant_name: string;
    recruiter_name: string;
    submitted_at: string | null;
    evaluation: unknown;
  };

  const { data: job, error: jobErr } = await sb
    .from("jobs")
    .select("title,company_name,recruiter_id")
    .eq("id", row.job_id)
    .maybeSingle();

  if (jobErr || !job) {
    return new NextResponse("Not found", { status: 404 });
  }

  const j = job as { title?: string; company_name?: string; recruiter_id: number };
  if (j.recruiter_id !== recruiterId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const ev = parseStoredEvaluation(row.evaluation);
  if (!ev) {
    return new NextResponse("Report not available — assessment may still be in progress.", { status: 404 });
  }

  const pdf = await buildAssessmentReportPdf({
    applicantName: row.applicant_name,
    jobTitle: j.title ?? "Role",
    companyName: j.company_name ?? "",
    recruiterName: row.recruiter_name,
    interviewId: row.id,
    submittedAt: row.submitted_at,
    evaluation: ev,
  });

  const filename = `candidate-assessment-${interviewId}.pdf`;
  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
