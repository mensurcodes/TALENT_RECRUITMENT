import { redirect } from "next/navigation";
import { LoginForm } from "./components/LoginForm";
import { SupabaseNotice } from "./components/SupabaseNotice";
import { getApplicantSessionId } from "./lib/auth";
import { hasSupabaseConfig } from "./lib/supabase";

export default async function ApplicantHomePage() {
  const sessionId = await getApplicantSessionId();
  if (sessionId) redirect("/applicant/jobs");

  const ok = hasSupabaseConfig();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-10">
      {/* Brand mark */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-2xl font-black text-cyan-300">
          T
        </div>
        <h1 className="mt-4 text-xl font-semibold text-white">Talent Recruitment</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Apply to matched roles and complete AI-powered assessments
        </p>
      </div>

      {!ok ? <SupabaseNotice /> : <LoginForm />}
    </div>
  );
}
