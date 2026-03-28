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
      className="text-sm text-zinc-400 transition hover:text-white disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Log out"}
    </button>
  );
}
