import { redirect } from "next/navigation";
import { ResultsClient } from "./ResultsClient";
import { requireApplicantSession } from "../../../lib/auth";

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function ResultsPage({ params }: Props) {
  const applicantId = await requireApplicantSession();
  const { jobId: raw } = await params;
  const jobId = Number(raw);
  if (!Number.isFinite(jobId)) {
    redirect("/applicant/jobs");
  }

  return <ResultsClient jobId={jobId} applicantId={applicantId} />;
}
