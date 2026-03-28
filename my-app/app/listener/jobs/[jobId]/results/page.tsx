import { redirect } from "next/navigation";
import { ResultsClient } from "./ResultsClient";
import { requireListenerApplicantId } from "../../../lib/auth";

type Props = {
  params: Promise<{ jobId: string }>;
};

export default async function ResultsPage({ params }: Props) {
  const applicantId = await requireListenerApplicantId();
  const { jobId: raw } = await params;
  const jobId = Number(raw);
  if (!Number.isFinite(jobId)) {
    redirect("/listener/jobs");
  }

  return <ResultsClient jobId={jobId} applicantId={applicantId} />;
}
