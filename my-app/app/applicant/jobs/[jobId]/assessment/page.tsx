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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Link
        href={`/applicant/jobs/${jobId}/apply`}
        className="text-sm font-bold text-emerald-700 hover:text-emerald-950"
      >
        ← Application
      </Link>
      <AssessmentRunner jobId={jobId} applicantId={applicantId} />
    </div>
  );
}
