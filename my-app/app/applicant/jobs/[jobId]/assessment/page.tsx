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
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href={`/applicant/jobs/${jobId}/apply`}
        className="text-[13px] font-medium text-blue-600 transition-colors duration-200 hover:text-blue-700"
      >
        ← Application
      </Link>
      <AssessmentRunner jobId={jobId} applicantId={applicantId} />
    </div>
  );
}
