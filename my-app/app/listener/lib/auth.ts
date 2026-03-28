import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LISTENER_APPLICANT_COOKIE } from "./constants";

export { LISTENER_APPLICANT_COOKIE };

export async function getListenerApplicantId(): Promise<number | null> {
  const c = await cookies();
  const v = c.get(LISTENER_APPLICANT_COOKIE)?.value;
  if (!v) return null;
  const id = Number(v);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function requireListenerApplicantId(): Promise<number> {
  const id = await getListenerApplicantId();
  if (!id) redirect("/listener");
  return id;
}
