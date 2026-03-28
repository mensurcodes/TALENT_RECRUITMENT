import type { EmploymentBucket } from "../types";

const FULL = new Set([
  "full_time",
  "fulltime",
  "full-time",
  "full time",
  "ft",
  "full",
]);

const INTERN = new Set([
  "internship",
  "intern",
  "co-op",
  "coop",
  "part-time intern",
]);

export function normalizeEmployment(raw: string | null | undefined): EmploymentBucket {
  if (!raw) return "unknown";
  const k = raw.trim().toLowerCase().replace(/[\s_]+/g, " ");
  const compact = k.replace(/[\s-]/g, "");
  if (FULL.has(k) || FULL.has(compact)) return "full_time";
  if (INTERN.has(k) || INTERN.has(compact)) return "internship";
  if (k.includes("intern")) return "internship";
  if (k.includes("full")) return "full_time";
  return "unknown";
}

export function jobMatchesApplicant(
  jobType: string | null | undefined,
  applicantBucket: EmploymentBucket,
): boolean {
  if (applicantBucket === "unknown") return true;
  const jobBucket = normalizeEmployment(jobType);
  if (jobBucket === "unknown") return true;
  return jobBucket === applicantBucket;
}
