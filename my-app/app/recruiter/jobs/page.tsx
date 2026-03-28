import { redirect } from "next/navigation";

/** Legacy path — job list lives on the dashboard. */
export default function RecruiterJobsRedirect() {
  redirect("/recruiter/dashboard");
}
