import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RECRUITER_SESSION_COOKIE } from "./constants";

export async function getRecruiterSessionId(): Promise<number | null> {
  const c = await cookies();
  const v = c.get(RECRUITER_SESSION_COOKIE)?.value;
  if (!v) return null;
  const id = Number(v);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function requireRecruiterSession(): Promise<number> {
  const id = await getRecruiterSessionId();
  if (!id) redirect("/recruiter");
  return id;
}
