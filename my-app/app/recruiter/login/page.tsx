"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function login() {
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) router.push("/recruiter/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 ring-1 ring-black/[.06] dark:bg-zinc-900 dark:ring-white/[.08]">
        <Image
          className="mb-6 dark:invert"
          src="/next.svg"
          alt="Next.js"
          width={80}
          height={16}
          priority
        />
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome back
        </h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">Sign in to continue</p>
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:focus:ring-zinc-700"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-transparent dark:text-zinc-50 dark:focus:ring-zinc-700"
          />
          <button
            onClick={login}
            className="mt-1 h-10 w-full rounded-full bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </button>
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">
          No account?{" "}
          <a
            href="/signup"
            className="font-medium text-zinc-900 dark:text-zinc-50"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
