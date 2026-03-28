"use server";

import { getSupabase, hasSupabaseConfig } from "./lib/supabase";

import { cookies } from "next/headers";
import { getApplicantSessionId } from "./lib/auth";
import { RECRUITER_SESSION_COOKIE } from "./lib/constants";
import { revalidatePath } from "next/cache";

export type JobInput = {
  recruiter_id: number;
  recruiter_name: string;
  title: string;
  company_name: string;
  employment_type?: string | null;
  description?: string | null;
  us_work_auth?: string | null;
  grading_rubric?: string | null;
};

/**
 * Get all jobs for a recruiter
 */
export async function fetchRecruiterJobs(recruiterId: number) {
  if (!hasSupabaseConfig()) return [];

  const sb = getSupabase();

  const { data, error } = await sb
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data;
}

export async function logoutRecruiter() {
  const cookieStore = await cookies();
  cookieStore.delete(RECRUITER_SESSION_COOKIE);
}

export async function fetchJob(jobId: number): Promise<JobRow | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from("jobs")
    .select(
      "id,recruiter_id,recruiter_name,title,company_name,employment_type,description,us_work_auth,grading_rubric",
    )
    .eq("id", jobId)
    .maybeSingle();
  if (error || !data) return null;
  return data as JobRow;
}
/**
 * Create a new job
 */
export async function createJob(input: JobInput) {
  if (!hasSupabaseConfig()) return { error: "Missing config" };

  const sb = getSupabase();

  const { error } = await sb.from("jobs").insert({
    ...input,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/recruiter/jobs");
  return { success: true };
}

/**
 * Update a job
 */
export async function updateJob(id: number, updates: Partial<JobInput>) {
  if (!hasSupabaseConfig()) return { error: "Missing config" };

  const sb = getSupabase();

  const { error } = await sb.from("jobs").update(updates).eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/recruiter/jobs");
  return { success: true };
}

/**
 * Delete a job
 */
export async function deleteJob(id: number) {
  if (!hasSupabaseConfig()) return { error: "Missing config" };

  const sb = getSupabase();

  const { error } = await sb.from("jobs").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/recruiter/jobs");
  return { success: true };
}

export async function fetchJobInterviews(jobId: number) {
  if (!hasSupabaseConfig()) return [];

  const sb = getSupabase();

  const { data, error } = await sb
    .from("interviews")
    .select("id, applicant_name, recruiter_name, result, feedback, created_at")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data;
}

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
  const cookieStore = await cookies();
  cookieStore.set(RECRUITER_SESSION_COOKIE, String(data.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}
