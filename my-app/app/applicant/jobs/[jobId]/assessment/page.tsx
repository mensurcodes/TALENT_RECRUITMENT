import { redirect } from "next/navigation";
import { AssessmentLock } from "./AssessmentLock";
import { AssessmentRunner } from "./AssessmentRunner";
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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <AssessmentLock jobId={jobId} />
      <AssessmentRunner jobId={jobId} applicantId={applicantId} />
    </div>
  );
}
