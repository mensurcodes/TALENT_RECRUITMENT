"use server";

import { cookies } from "next/headers";
import { getSupabase, hasSupabaseConfig } from "../applicant/lib/supabase";
import { RECRUITER_SESSION_COOKIE } from "./lib/constants";
import type { InterviewRow, JobRow } from "../applicant/types";

const INTERVIEW_SELECT =
  "id,job_id,applicant_id,applicant_name,recruiter_name,score,max_score,summary,github_url,resume_label,assessment_status,assessment_deadline_at,applied_at,answer_details,evaluation,submitted_at,created_at";

export type RecruiterRow = {
  id: number;
  name: string;
  email: string;
  company_name: string;
  username: string;
};

export async function loginRecruiter(
  username: string,
  password: string,
): Promise<{ ok?: true; error?: string }> {
  if (!hasSupabaseConfig()) return { error: "Supabase is not configured." };
  const u = username.trim();
  if (!u || !password) return { error: "Enter username and password." };
  const sb = getSupabase();
  const { data, error } = await sb
    .from("recruiters")
    .select("id")
    .eq("username", u)
    .eq("password", password)
    .maybeSingle();
  if (error || !data) return { error: "Invalid username or password." };
  const store = await cookies();
  store.set(RECRUITER_SESSION_COOKIE, String((data as { id: number }).id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return { ok: true };
}

export async function logoutRecruiter(): Promise<void> {
  const store = await cookies();
  store.delete(RECRUITER_SESSION_COOKIE);
}

export async function fetchRecruiter(recruiterId: number): Promise<RecruiterRow | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from("recruiters")
    .select("id,name,email,company_name,username")
    .eq("id", recruiterId)
    .maybeSingle();
  if (error || !data) return null;
  return data as RecruiterRow;
}

export async function fetchJobsForRecruiter(recruiterId: number): Promise<JobRow[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from("jobs")
    .select(
      "id,recruiter_id,recruiter_name,title,company_name,employment_type,description,us_work_auth,grading_rubric",
    )
    .eq("recruiter_id", recruiterId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as JobRow[];
}

export async function fetchJobForRecruiter(
  recruiterId: number,
  jobId: number,
): Promise<JobRow | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from("jobs")
    .select(
      "id,recruiter_id,recruiter_name,title,company_name,employment_type,description,us_work_auth,grading_rubric",
    )
    .eq("recruiter_id", recruiterId)
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) return null;
  return data as JobRow;
}

export async function fetchInterviewsForJob(
  recruiterId: number,
  jobId: number,
): Promise<InterviewRow[]> {
  if (!hasSupabaseConfig()) return [];
  const job = await fetchJobForRecruiter(recruiterId, jobId);
  if (!job) return [];

  const sb = getSupabase();
  const { data, error } = await sb
    .from("interviews")
    .select(`${INTERVIEW_SELECT},jobs(title,company_name,employment_type)`)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  type Raw = InterviewRow & { jobs: InterviewRow["job"] };
  return (data as unknown as Raw[]).map((row) => ({
    ...row,
    job: row.jobs,
  }));
}
