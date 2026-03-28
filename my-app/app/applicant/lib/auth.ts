import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { APPLICANT_SESSION_COOKIE } from "./constants";

export { APPLICANT_SESSION_COOKIE };

export async function getApplicantSessionId(): Promise<number | null> {
  const c = await cookies();
  const v = c.get(APPLICANT_SESSION_COOKIE)?.value;
  if (!v) return null;
  const id = Number(v);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function requireApplicantSession(): Promise<number> {
  const id = await getApplicantSessionId();
  if (!id) redirect("/applicant");
  return id;
}
