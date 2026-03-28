export type EmploymentBucket = "full_time" | "internship" | "unknown";

export type ApplicantRow = {
  id: number;
  name: string;
  email: string;
  username: string;
  employment_type: string | null;
  resume_url: string | null;
  github_url: string | null;
};

export type JobRow = {
  id: number;
  recruiter_id: number;
  recruiter_name: string;
  title: string;
  company_name: string;
  employment_type: string | null;
  description: string | null;
  us_work_auth: string | null;
  grading_rubric: string | null;
};

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  /** Seconds to think before answering (HackerRank-style prep). */
  prepSeconds: number;
  /** Max seconds to answer (0 = no hard limit). */
  answerSeconds: number;
};

export type GeneratedAssessment = {
  resumeDigest: string;
  codebaseDigest: string;
  questions: AssessmentQuestion[];
};

export type RubricEvaluation = {
  overallScore: number;
  maxScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  rubricBreakdown: { criterion: string; score: number; max: number; note: string }[];
};

/** One question’s stored responses (tied to interview.answer_details in DB). */
export type QuestionAnswerDetail = {
  questionId: string;
  prompt: string;
  writtenNotes: string;
  /** Whisper / speech-to-text from video */
  videoTranscript: string;
  /** True when a video was recorded (may still be false if inline body omitted) */
  hadVideoRecording: boolean;
  /**
   * Path inside Supabase Storage bucket `assessment-videos` (set when SUPABASE_SERVICE_ROLE_KEY is configured).
   * Format: `{applicantId}/{jobId}/{timestamp}_{questionId}.webm`
   */
  videoObjectPath?: string | null;
  /** Inline base64 only when storage is unavailable or upload failed; omit for large blobs */
  videoWebmBase64: string | null;
  /** If neither storage nor inline video was saved */
  videoSkippedReason: string | null;
  answeredAt: string;
};

export type InterviewRow = {
  id: number;
  job_id: number;
  applicant_id: number | null;
  applicant_name: string;
  recruiter_name: string;
  result: string | null;
  feedback: string | null;
  score: number | null;
  max_score: number | null;
  summary: string | null;
  github_url: string | null;
  resume_label: string | null;
  answer_details?: QuestionAnswerDetail[] | null;
  submitted_at: string | null;
  created_at: string;
  /** joined from jobs when fetched with job data */
  job?: Pick<JobRow, "title" | "company_name" | "employment_type">;
};

export const APPLICANT_ASSESSMENT_KEY = "talent_applicant_assessment_v1";

export type StoredAssessment = {
  jobId: number;
  applicantId: number;
  applicantName: string;
  job: JobRow;
  resumeUrl: string;
  githubUrl: string;
  generated: GeneratedAssessment;
  /** Combined text per question (notes + transcript) for rubric scoring */
  answers: Record<string, string>;
  /** Structured storage for DB / review */
  questionDetails: QuestionAnswerDetail[];
  evaluation: RubricEvaluation | null;
  submittedAt: string | null;
};
