"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutApplicant } from "../actions";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await logoutApplicant();
        router.push("/applicant");
        router.refresh();
        setPending(false);
      }}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
