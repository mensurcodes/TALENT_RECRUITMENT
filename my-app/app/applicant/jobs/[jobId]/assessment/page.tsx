import { redirect } from "next/navigation";
import { AssessmentLock } from "./AssessmentLock";
import { AssessmentRunner } from "./AssessmentRunner";
import { checkExistingApplication } from "../../../actions";
import { requireApplicantSession } from "../../../lib/auth";

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function AssessmentPage({ params }: Props) {
  const applicantId = await requireApplicantSession();
  const { jobId: raw } = await params;
  const jobId = Number(raw);
  if (!Number.isFinite(jobId)) {
    redirect("/applicant/jobs");
  }

  const row = await checkExistingApplication(applicantId, jobId);
  if (row?.submitted_at || row?.assessment_status === "completed") {
    redirect(`/applicant/jobs/${jobId}/results`);
  }
  if (row?.assessment_deadline_at) {
    const end = new Date(row.assessment_deadline_at).getTime();
    if (end < Date.now()) {
      redirect(`/applicant/jobs/${jobId}?interview=expired`);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <AssessmentLock jobId={jobId} />
      <AssessmentRunner jobId={jobId} applicantId={applicantId} />
    </div>
  );
}
