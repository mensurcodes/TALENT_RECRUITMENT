import { redirect } from "next/navigation";
import { ResultsClient } from "./ResultsClient";

type Props = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ applicantId?: string }>;
};

export default async function ResultsPage({ params, searchParams }: Props) {
  const { jobId: raw } = await params;
  const sp = await searchParams;
  const jobId = Number(raw);
  const applicantId = Number(sp.applicantId);
  if (!Number.isFinite(jobId) || !Number.isFinite(applicantId)) {
    redirect("/listener");
  }

  return <ResultsClient jobId={jobId} applicantId={applicantId} />;
}
