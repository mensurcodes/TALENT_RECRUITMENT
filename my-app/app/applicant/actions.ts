"use server";

import { cookies } from "next/headers";
import { getApplicantSessionId } from "./lib/auth";
import { APPLICANT_SESSION_COOKIE } from "./lib/constants";
import { getSupabase, hasSupabaseConfig } from "./lib/supabase";
import { fetchGithubContext } from "./lib/github";
import { fetchResumeExcerpt } from "./lib/resume";
import { jobMatchesApplicant, normalizeEmployment } from "./lib/employment";
import type {
  ApplicantRow,
  AssessmentQuestion,
  GeneratedAssessment,
  InterviewRow,
  JobRow,
  RubricEvaluation,
} from "./types";

async function openaiJson<T>(system: string, user: string): Promise<T | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function fetchApplicantSummaries(): Promise<
  Pick<ApplicantRow, "id" | "name" | "email">[]
> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from("applicants")
    .select("id,name,email")
    .order("id", { ascending: true })
    .limit(200);
  if (error || !data) return [];
  return data as Pick<ApplicantRow, "id" | "name" | "email">[];
}

export async function fetchApplicant(applicantId: number): Promise<ApplicantRow | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from("applicants")
    .select("id,name,email,username,employment_type,resume_url,github_url")
    .eq("id", applicantId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ApplicantRow;
}

export async function fetchQualifiedJobs(applicantId: number): Promise<JobRow[]> {
  if (!hasSupabaseConfig()) return [];
  const applicant = await fetchApplicant(applicantId);
  if (!applicant) return [];
  const bucket = normalizeEmployment(applicant.employment_type);
  const sb = getSupabase();
  const { data, error } = await sb
    .from("jobs")
    .select(
      "id,recruiter_id,recruiter_name,title,company_name,employment_type,description,us_work_auth,grading_rubric",
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as JobRow[]).filter((j) => jobMatchesApplicant(j.employment_type, bucket));
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

function mockQuestions(job: JobRow): AssessmentQuestion[] {
  const title = job.title;
  const company = job.company_name;
  return [
    {
      id: "q1",
      prompt: `For "${title}" at ${company}: describe a concrete project from your background (resume or GitHub) that proves you can own a feature end-to-end. What was ambiguous and how did you resolve it?`,
      prepSeconds: 60,
      answerSeconds: 300,
    },
    {
      id: "q2",
      prompt: `Given your repository’s stated stack and README themes, what is one reliability or security risk you would address before shipping to users, and what change would you make?`,
      prepSeconds: 60,
      answerSeconds: 300,
    },
    {
      id: "q3",
      prompt: `The role emphasizes collaboration. Tell us about a time you improved code review or documentation in a team setting, referencing specifics from your experience.`,
      prepSeconds: 60,
      answerSeconds: 300,
    },
  ];
}

function mockEvaluation(
  job: JobRow,
  questions: AssessmentQuestion[],
  answers: Record<string, string>,
): RubricEvaluation {
  const answered = questions.filter((q) => (answers[q.id] ?? "").trim().length > 8).length;
  const base = Math.min(100, 55 + answered * 12);
  return {
    overallScore: base,
    maxScore: 100,
    summary:
      "Demo mode (no OPENAI_API_KEY): heuristic score from answer completeness. Add your API key for rubric-aligned scoring.",
    strengths: [
      answered >= 2 ? "Multiple substantive responses recorded." : "Assessment completed.",
      job.grading_rubric ? "Recruiter rubric was present for future AI grading." : "",
    ].filter(Boolean),
    improvements: [
      "Set OPENAI_API_KEY to grade against the recruiter rubric and resume/GitHub context.",
    ],
    rubricBreakdown: [
      {
        criterion: "Completeness",
        score: answered,
        max: questions.length,
        note: "Number of questions with non-trivial answers.",
      },
    ],
  };
}

const MAX_PDF_BYTES = 8 * 1024 * 1024;

export async function buildAssessmentFromApplyForm(
  formData: FormData,
): Promise<
  | { job: JobRow; applicant: ApplicantRow; generated: GeneratedAssessment; resumeLabel: string }
  | { error: string }
> {
  if (!hasSupabaseConfig()) return { error: "Supabase is not configured." };
  const sessionId = await getApplicantSessionId();
  if (!sessionId) return { error: "Sign in to continue." };

  const jobId = Number(formData.get("jobId"));
  if (!Number.isFinite(jobId) || jobId <= 0) return { error: "Invalid job." };

  const githubUrl = String(formData.get("githubUrl") ?? "").trim();
  if (!githubUrl) return { error: "GitHub repository URL is required." };

  const [job, applicant] = await Promise.all([fetchJob(jobId), fetchApplicant(sessionId)]);
  if (!job) return { error: "Job not found." };
  if (!applicant) return { error: "Applicant not found." };
  if (!jobMatchesApplicant(job.employment_type, normalizeEmployment(applicant.employment_type))) {
    return { error: "This job does not match your employment preference." };
  }

  const alreadyApplied = await checkExistingApplication(sessionId, jobId);
  if (alreadyApplied) {
    return { error: "ALREADY_APPLIED" };
  }

  const resumeFile = formData.get("resumePdf");
  const resumeUrl = String(formData.get("resumeUrl") ?? "").trim();

  let resumePlain = "";
  let resumeLabel = "";

  if (resumeFile instanceof File && resumeFile.size > 0) {
    if (resumeFile.size > MAX_PDF_BYTES) {
      return { error: "PDF must be 8MB or smaller." };
    }
    const name = resumeFile.name.toLowerCase();
    const type = resumeFile.type;
    if (type && type !== "application/pdf" && !type.includes("pdf") && !name.endsWith(".pdf")) {
      return { error: "Resume upload must be a PDF file." };
    }
    const buf = Buffer.from(await resumeFile.arrayBuffer());
    const { extractPdfText } = await import("./lib/pdf");
    const parsed = await extractPdfText(buf);
    if (parsed.error) return { error: parsed.error };
    resumePlain = parsed.text;
    resumeLabel = `PDF: ${resumeFile.name}`;
  } else if (resumeUrl) {
    resumePlain = await fetchResumeExcerpt(resumeUrl);
    resumeLabel = resumeUrl;
  } else {
    return { error: "Upload a PDF resume or enter a resume URL." };
  }

  const resumeDigest = resumePlain.slice(0, 8000);
  const gh = await fetchGithubContext(githubUrl);
  const codebaseDigest = gh
    ? [
        `Repo: ${gh.owner}/${gh.repo}`,
        gh.description ? `Description: ${gh.description}` : "",
        gh.language ? `Primary language: ${gh.language}` : "",
        gh.topics.length ? `Topics: ${gh.topics.join(", ")}` : "",
        gh.readmeExcerpt ? `README excerpt:\n${gh.readmeExcerpt.slice(0, 4000)}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "[GitHub context unavailable — verify URL is a public github.com repo or add GITHUB_TOKEN.]";

  const system = `You are an expert hiring assessor. Output strict JSON only.
Schema:
{
  "questions": [
    {
      "id": "q1",
      "prompt": "string",
      "prepSeconds": 60,
      "answerSeconds": 300
    }
  ]
}
Rules:
- 3 to 5 questions.
- Questions MUST reference specifics inferred from resume excerpt and GitHub context (skills, projects, languages). If data is thin, say so in the question and still tie to role.
- prepSeconds always 60. answerSeconds always 300 unless role needs longer (max 420).
- No boilerplate "tell me about yourself". Make them technical/behavioral hybrids like HackerRank written assessments.`;

  const user = `Job title: ${job.title}
Company: ${job.company_name}
Employment: ${job.employment_type ?? "unspecified"}
Job description:\n${(job.description ?? "").slice(0, 6000)}

Resume excerpt:\n${resumeDigest}

GitHub / codebase context:\n${codebaseDigest.slice(0, 6000)}`;

  const parsed = await openaiJson<{ questions: AssessmentQuestion[] }>(system, user);
  let questions: AssessmentQuestion[] =
    parsed?.questions?.filter((q) => q.id && q.prompt)?.map((q) => ({
      id: String(q.id),
      prompt: String(q.prompt),
      prepSeconds: Number(q.prepSeconds) > 0 ? Number(q.prepSeconds) : 60,
      answerSeconds: Number(q.answerSeconds) > 0 ? Number(q.answerSeconds) : 300,
    })) ?? [];

  if (questions.length < 3) {
    questions = mockQuestions(job);
  }

  const generated: GeneratedAssessment = {
    resumeDigest,
    codebaseDigest,
    questions,
  };

  return { job, applicant, generated, resumeLabel };
}

export async function transcribeVideoAnswer(
  formData: FormData,
): Promise<{ text: string } | { error: string }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { error: "Add OPENAI_API_KEY to transcribe video answers (Whisper)." };
  }
  const file = formData.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return { error: "No video recording was uploaded." };
  }
  const outbound = new FormData();
  outbound.append("file", file, "answer.webm");
  outbound.append("model", "whisper-1");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: outbound,
  });
  if (!res.ok) {
    const err = await res.text();
    return { error: `Transcription failed (${res.status}). ${err.slice(0, 180)}` };
  }
  const data = (await res.json()) as { text?: string };
  if (!data.text?.trim()) {
    return { error: "Transcription returned empty text. Try again or use the text box." };
  }
  return { text: data.text.trim() };
}

export async function evaluateWithRubric(input: {
  job: JobRow;
  generated: GeneratedAssessment;
  answers: Record<string, string>;
  applicantId: number;
}): Promise<RubricEvaluation> {
  const { job, generated, answers, applicantId } = input;
  const sessionId = await getApplicantSessionId();
  if (!sessionId || sessionId !== applicantId) {
    return {
      overallScore: 0,
      maxScore: 100,
      summary: "Your session is invalid or expired. Sign in again and retry the assessment.",
      strengths: [],
      improvements: ["Re-authenticate from the applicant portal home page."],
      rubricBreakdown: [],
    };
  }
  const rubric = (job.grading_rubric ?? "").trim() || "General: communication, technical depth, relevance, structure.";
  const qa = generated.questions
    .map((q) => `Q (${q.id}): ${q.prompt}\nA: ${answers[q.id] ?? ""}`)
    .join("\n\n");

  const system = `You are a senior hiring manager. Score the candidate using the recruiter rubric.
Return strict JSON:
{
  "overallScore": number,
  "maxScore": 100,
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "rubricBreakdown": [{ "criterion": string, "score": number, "max": number, "note": string }]
}
Be candid, actionable, and reference rubric criteria by name when possible.`;

  const user = `Rubric:\n${rubric}\n\nJob: ${job.title} at ${job.company_name}\nDescription:\n${(job.description ?? "").slice(0, 4000)}\n\nResume digest:\n${generated.resumeDigest.slice(0, 2500)}\n\nCodebase digest:\n${generated.codebaseDigest.slice(0, 2500)}\n\nInterview answers:\n${qa}`;

  const out = await openaiJson<RubricEvaluation>(system, user);
  if (
    out &&
    typeof out.overallScore === "number" &&
    Array.isArray(out.strengths) &&
    Array.isArray(out.improvements)
  ) {
    return {
      overallScore: Math.max(0, Math.min(100, out.overallScore)),
      maxScore: typeof out.maxScore === "number" ? out.maxScore : 100,
      summary: out.summary,
      strengths: out.strengths,
      improvements: out.improvements,
      rubricBreakdown: Array.isArray(out.rubricBreakdown) ? out.rubricBreakdown : [],
    };
  }

  return mockEvaluation(job, generated.questions, answers);
}

export async function checkExistingApplication(
  applicantId: number,
  jobId: number,
): Promise<InterviewRow | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from("interviews")
    .select("id,job_id,applicant_id,applicant_name,recruiter_name,score,max_score,summary,github_url,resume_label,submitted_at,created_at")
    .eq("applicant_id", applicantId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as InterviewRow;
}

export async function fetchMyInterviews(applicantId: number): Promise<InterviewRow[]> {
  if (!hasSupabaseConfig()) return [];
  const sb = getSupabase();
  const { data, error } = await sb
    .from("interviews")
    .select(
      "id,job_id,applicant_id,applicant_name,recruiter_name,score,max_score,summary,github_url,resume_label,submitted_at,created_at,jobs(title,company_name,employment_type)",
    )
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  type RawRow = InterviewRow & { jobs: InterviewRow["job"] };
  return (data as unknown as RawRow[]).map((row) => ({
    ...row,
    job: row.jobs,
  }));
}

export async function saveApplicationResult(input: {
  jobId: number;
  applicantId: number;
  evaluation: RubricEvaluation;
  resumeLabel: string;
  githubUrl: string;
}): Promise<{ ok: true; interviewId: number } | { error: string }> {
  if (!hasSupabaseConfig()) return { error: "Supabase not configured." };
  const sessionId = await getApplicantSessionId();
  if (!sessionId || sessionId !== input.applicantId) return { error: "Unauthorized." };

  const [job, applicant] = await Promise.all([
    fetchJob(input.jobId),
    fetchApplicant(input.applicantId),
  ]);
  if (!job || !applicant) return { error: "Job or applicant not found." };

  // upsert: only insert once per applicant + job
  const existing = await checkExistingApplication(input.applicantId, input.jobId);
  if (existing) return { ok: true, interviewId: existing.id };

  const sb = getSupabase();
  const { data, error } = await sb
    .from("interviews")
    .insert({
      job_id: input.jobId,
      applicant_id: input.applicantId,
      applicant_name: applicant.name,
      recruiter_name: job.recruiter_name,
      result: `${input.evaluation.overallScore}/${input.evaluation.maxScore}`,
      score: input.evaluation.overallScore,
      max_score: input.evaluation.maxScore,
      summary: input.evaluation.summary,
      github_url: input.githubUrl,
      resume_label: input.resumeLabel,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Failed to save." };
  return { ok: true, interviewId: (data as { id: number }).id };
}

export async function fetchInterviewForJob(
  applicantId: number,
  jobId: number,
): Promise<(InterviewRow & { job: InterviewRow["job"] }) | null> {
  if (!hasSupabaseConfig()) return null;
  const sb = getSupabase();
  const { data, error } = await sb
    .from("interviews")
    .select(
      "id,job_id,applicant_id,applicant_name,recruiter_name,score,max_score,summary,github_url,resume_label,submitted_at,created_at,jobs(title,company_name,employment_type)",
    )
    .eq("applicant_id", applicantId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as InterviewRow & { jobs: InterviewRow["job"] };
  return { ...row, job: row.jobs };
}

export async function loginApplicant(
  username: string,
  password: string,
): Promise<{ ok?: true; error?: string }> {
  if (!hasSupabaseConfig()) return { error: "Supabase is not configured." };
  const u = username.trim();
  if (!u || !password) return { error: "Enter username and password." };
  const sb = getSupabase();
  const { data, error } = await sb
    .from("applicants")
    .select("id")
    .eq("username", u)
    .eq("password", password)
    .maybeSingle();
  if (error || !data) return { error: "Invalid username or password." };
  const cookieStore = await cookies();
  cookieStore.set(APPLICANT_SESSION_COOKIE, String(data.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}

export async function logoutApplicant(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(APPLICANT_SESSION_COOKIE);
}
