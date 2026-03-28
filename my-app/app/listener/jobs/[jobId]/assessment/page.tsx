import Link from "next/link";
import { redirect } from "next/navigation";
import { AssessmentRunner } from "./AssessmentRunner";

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ applicantId?: string }>;
};

export default async function AssessmentPage({ params, searchParams }: Props) {
  const { jobId: raw } = await params;
  const sp = await searchParams;
  const jobId = Number(raw);
  const applicantId = Number(sp.applicantId);
  if (!Number.isFinite(jobId) || !Number.isFinite(applicantId)) {
    redirect("/listener");
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/listener/jobs/${jobId}/apply?applicantId=${applicantId}`}
        className="text-sm text-cyan-400 hover:text-cyan-300"
      >
        ← Back to application
      </Link>
      <AssessmentRunner jobId={jobId} applicantId={applicantId} />
    </div>
  );
}
