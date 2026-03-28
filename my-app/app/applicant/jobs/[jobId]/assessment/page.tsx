import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="space-y-6">
      <Link
        href={`/applicant/jobs/${jobId}/apply`}
        className="text-sm text-cyan-400 hover:text-cyan-300"
      >
        ← Back to application
      </Link>
      <AssessmentRunner jobId={jobId} applicantId={applicantId} />
    </div>
  );
}
