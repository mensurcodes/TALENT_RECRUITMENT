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
      className="rounded-full border-2 border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
