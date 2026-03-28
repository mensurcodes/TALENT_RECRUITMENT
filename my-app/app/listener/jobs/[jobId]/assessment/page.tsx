import Link from "next/link";
import { redirect } from "next/navigation";
import { AssessmentRunner } from "./AssessmentRunner";
import { requireListenerApplicantId } from "../../../lib/auth";

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function AssessmentPage({ params }: Props) {
  const applicantId = await requireListenerApplicantId();
  const { jobId: raw } = await params;
  const jobId = Number(raw);
  if (!Number.isFinite(jobId)) {
    redirect("/listener/jobs");
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/listener/jobs/${jobId}/apply`}
        className="text-sm text-cyan-400 hover:text-cyan-300"
      >
        ← Back to application
      </Link>
      <AssessmentRunner jobId={jobId} applicantId={applicantId} />
    </div>
  );
}
