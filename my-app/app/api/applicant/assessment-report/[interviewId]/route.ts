import { NextResponse } from "next/server";
import { getApplicantSessionId } from "@/app/applicant/lib/auth";
import { buildAssessmentReportPdf } from "@/app/applicant/lib/assessmentPdf";
import { parseStoredEvaluation } from "@/app/applicant/lib/evaluationParse";
import { getSupabase, hasSupabaseConfig } from "@/app/applicant/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ interviewId: string }> },
) {
  const applicantId = await getApplicantSessionId();
  if (!applicantId) {
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
  const { data: inv, error } = await sb
    .from("interviews")
    .select("id,job_id,applicant_name,recruiter_name,submitted_at,evaluation")
    .eq("id", interviewId)
    .eq("applicant_id", applicantId)
    .maybeSingle();

  if (error || !inv) {
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

  const ev = parseStoredEvaluation(row.evaluation);
  if (!ev) {
    return new NextResponse("Report not available yet — complete the assessment first.", { status: 404 });
  }

  const { data: jobRow } = await sb
    .from("jobs")
    .select("title,company_name")
    .eq("id", row.job_id)
    .maybeSingle();

  const job = jobRow as { title?: string; company_name?: string } | null;

  const pdf = await buildAssessmentReportPdf({
    applicantName: row.applicant_name,
    jobTitle: job?.title ?? "Role",
    companyName: job?.company_name ?? "",
    recruiterName: row.recruiter_name,
    interviewId: row.id,
    submittedAt: row.submitted_at,
    evaluation: ev,
  });

  const filename = `assessment-report-${interviewId}.pdf`;
  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
