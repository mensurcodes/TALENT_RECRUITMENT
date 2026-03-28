"use server";

import { cookies } from "next/headers";
import { getApplicantSessionId } from "./lib/auth";
import { APPLICANT_SESSION_COOKIE } from "./lib/constants";
import { getSupabase, hasSupabaseConfig } from "./lib/supabase";
import {
  ASSESSMENT_VIDEOS_BUCKET,
  getSupabaseAdmin,
  hasSupabaseServiceRole,
} from "./lib/supabaseAdmin";
import { fetchGithubContext, githubRepoUrlHint } from "./lib/github";
import { fetchResumeExcerpt } from "./lib/resume";
import { jobMatchesApplicant, normalizeEmployment } from "./lib/employment";
import type {
  ApplicantRow,
  AssessmentQuestion,
  GeneratedAssessment,
  InterviewRow,
  JobRow,
  QuestionAnswerDetail,
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

const MAX_PDF_BYTES = 8 * 1024 * 1024;

/** Fallback when OpenAI is unavailable — resume + repo, analytical tone, five prompts. */
function mockQuestions(): AssessmentQuestion[] {
  return [
    {
      id: "q1",
      prompt: `Pick a project from your resume that lines up with the GitHub context we have. In plain terms, what problem does that project solve and what stack did you use?`,
      prepSeconds: 60,
      answerSeconds: 300,
    },
    {
      id: "q2",
      prompt: `In one of those projects, describe the main moving parts of the codebase (e.g. API layer, UI, data layer) and how data flows between them — no need for exact file paths.`,
      prepSeconds: 60,
      answerSeconds: 300,
    },
    {
      id: "q3",
      prompt: `What engineering trade-off did you accept in that project (performance vs simplicity, speed vs correctness, etc.) and why was it reasonable at the time?`,
      prepSeconds: 60,
      answerSeconds: 300,
    },
    {
      id: "q4",
      prompt: `Point to a non-trivial function or module in the repo (describe it as “the part that handles X”) and explain what it does and why it exists — focus on intent, not memorized line-by-line detail.`,
      prepSeconds: 60,
      answerSeconds: 300,
    },
    {
      id: "q5",
      prompt: `If you were to extend that project for twice the traffic or users, what would you harden or refactor first, and what would you leave alone?`,
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
      "Set OPENAI_API_KEY to grade against the recruiter rubric and GitHub/repo context.",
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
  const urlHint = githubRepoUrlHint(githubUrl);
  if (urlHint) return { error: urlHint };

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
    return { error: "Upload a PDF resume or paste a resume URL so we can align questions with projects you list." };
  }

  const resumeDigest = resumePlain.slice(0, 8000);

  const ghResult = await fetchGithubContext(githubUrl, resumePlain);
  if (!ghResult) {
    return {
      error:
        "Could not load GitHub data. Use a public repo URL (https://github.com/owner/repo) or a profile URL (https://github.com/username) — we merge up to five public repos (prioritized by your resume). Unknown users, private-only activity, or rate limits: add GITHUB_TOKEN to .env.local.",
    };
  }

  const gh = ghResult.context;
  const reposForQuestions = ghResult.reposForQuestions;

  const codebaseDigest = [
    `Repo: ${gh.owner}/${gh.repo}`,
    gh.codebaseIndexed
      ? "Public repo: default-branch file tree + source excerpts were fetched via GitHub API."
      : "Public repo metadata only (tree/snippets unavailable — private repo, rate limit, or API error).",
    gh.description ? `Description: ${gh.description}` : "",
    gh.language ? `Languages: ${gh.language}` : "",
    gh.topics.length ? `Topics: ${gh.topics.join(", ")}` : "",
    gh.fileTreeSample.length
      ? `Sample file paths (${gh.fileTreeSample.length}):\n${gh.fileTreeSample.join("\n")}`
      : "",
    gh.readmeExcerpt ? `README excerpt:\n${gh.readmeExcerpt.slice(0, 4500)}` : "",
    gh.codeSnippetsDigest
      ? `Source file excerpts (from public repo):\n${gh.codeSnippetsDigest.slice(0, 12_000)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const system = `You are an expert technical interviewer. Output strict JSON only.
Schema:
{
  "questions": [
    { "id": "q1", "prompt": "string", "prepSeconds": 60, "answerSeconds": 300 }
  ]
}
Rules:
- Exactly 5 questions (ids q1–q5).
- You receive the candidate's resume excerpt AND a GitHub digest (one repo or several merged). Use BOTH: questions should test whether they understand work they claim and how it shows up in code.
- Prefer projects/repos that appear on the resume. The digest may include several repositories — prioritize those listed under "Repositories to emphasize" when they overlap the resume; if a repo is not on the resume, do not center questions on it unless the digest only contains that repo.
- Question style: engineering judgment, design trade-offs, why an approach or algorithm fits the problem, what a key function or subsystem does in plain language. Good: goals of a project, stack, data flow, reliability/scalability instincts, "why this over that". Bad: trivia like reciting npm scripts from package.json, memorized exact paths, or "what line does X". You may refer to code as "in this project", "in the main game logic file", "the API layer" — not full owner/repo/path strings unless one short name helps clarity.
- Do not mention employers or job postings unless the resume names them; no "tell me about yourself" filler.
- prepSeconds always 60. answerSeconds always 300 unless a question clearly needs 360–420 for depth.`;

  const user = `Resume excerpt:\n${resumeDigest}

Repositories to emphasize (resume-matched first when using a profile URL):\n${reposForQuestions.join(", ") || "(single repo)"}

GitHub / codebase digest:\n${codebaseDigest.slice(0, 16_000)}`;

  const parsed = await openaiJson<{ questions: AssessmentQuestion[] }>(system, user);
  let questions: AssessmentQuestion[] =
    parsed?.questions?.filter((q) => q.id && q.prompt)?.map((q) => ({
      id: String(q.id),
      prompt: String(q.prompt),
      prepSeconds: Number(q.prepSeconds) > 0 ? Number(q.prepSeconds) : 60,
      answerSeconds: Number(q.answerSeconds) > 0 ? Number(q.answerSeconds) : 300,
    })) ?? [];

  if (questions.length >= 5) {
    questions = questions.slice(0, 5);
  } else {
    questions = mockQuestions();
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

const MAX_ASSESSMENT_VIDEO_BYTES = 15 * 1024 * 1024;

/** Upload one answer clip to private Supabase Storage (requires service role on server). */
export async function uploadAssessmentVideo(
  formData: FormData,
): Promise<{ objectPath: string } | { error: string }> {
  if (!hasSupabaseServiceRole()) {
    return { error: "STORAGE_NOT_CONFIGURED" };
  }
  const applicantId = await getApplicantSessionId();
  if (!applicantId) return { error: "Sign in required." };

  const jobId = Number(formData.get("jobId"));
  const questionId = String(formData.get("questionId") ?? "").trim();
  const file = formData.get("video");

  if (!Number.isFinite(jobId) || jobId <= 0) return { error: "Invalid job." };
  if (!questionId) return { error: "Invalid question." };
  if (!(file instanceof Blob) || file.size === 0) return { error: "No video file." };
  if (file.size > MAX_ASSESSMENT_VIDEO_BYTES) {
    return { error: "Video exceeds 15MB limit." };
  }

  const safeQ = questionId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const objectPath = `${applicantId}/${jobId}/${Date.now()}_${safeQ}.webm`;

  try {
    const admin = getSupabaseAdmin();
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage.from(ASSESSMENT_VIDEOS_BUCKET).upload(objectPath, buf, {
      contentType: file.type || "video/webm",
      upsert: false,
    });
    if (error) return { error: error.message };
    return { objectPath };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return { error: msg };
  }
}

/**
 * Short-lived signed URL so the signed-in applicant can play back their own clip.
 * objectPath must match `{applicantId}/{jobId}/...`.
 */
export async function getAssessmentVideoSignedUrl(
  objectPath: string,
  jobId: number,
): Promise<{ url: string } | { error: string }> {
  if (!hasSupabaseServiceRole()) return { error: "Storage not configured." };
  const applicantId = await getApplicantSessionId();
  if (!applicantId) return { error: "Sign in required." };

  const prefix = `${applicantId}/${jobId}/`;
  if (!objectPath.startsWith(prefix) || objectPath.includes("..")) {
    return { error: "Invalid path." };
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(ASSESSMENT_VIDEOS_BUCKET)
      .createSignedUrl(objectPath, 3600);
    if (error || !data?.signedUrl) return { error: error?.message ?? "Could not sign URL." };
    return { url: data.signedUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return { error: msg };
  }
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

  const resumePart = generated.resumeDigest.trim();
  const resumeBlock = resumePart.slice(0, 2500) || "(Not provided — score using job fit, rubric, answers, and repo context below.)";
  const codeBlock = generated.codebaseDigest.slice(0, resumePart ? 2500 : 4500);
  const user = `Rubric:\n${rubric}\n\nJob: ${job.title} at ${job.company_name}\nDescription:\n${(job.description ?? "").slice(0, 4000)}\n\nResume digest:\n${resumeBlock}\n\nCodebase digest:\n${codeBlock}\n\nInterview answers:\n${qa}`;

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
    .select(
      "id,job_id,applicant_id,applicant_name,recruiter_name,score,max_score,summary,github_url,resume_label,answer_details,submitted_at,created_at",
    )
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
      "id,job_id,applicant_id,applicant_name,recruiter_name,score,max_score,summary,github_url,resume_label,answer_details,submitted_at,created_at,jobs(title,company_name,employment_type)",
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
  questionDetails: QuestionAnswerDetail[];
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
      answer_details: input.questionDetails,
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
      "id,job_id,applicant_id,applicant_name,recruiter_name,score,max_score,summary,github_url,resume_label,answer_details,submitted_at,created_at,jobs(title,company_name,employment_type)",
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
