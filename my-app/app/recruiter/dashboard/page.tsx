// app/dashboard/page.tsx
export default function Dashboard() {
  const candidates = ["Alice Johnson", "Bob Smith", "Carol White"];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="flex gap-4 border-b border-black/10 px-8 py-4 bg-white dark:bg-zinc-900">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50 mr-auto">
          MyApp
        </span>
        <button className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
          View Candidates
        </button>
        <button className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">
          Create Job
        </button>
      </nav>

      <main className="px-8 py-10 max-w-2xl mx-auto">
        <ul className="flex flex-col gap-3">
          {candidates.map((name) => (
            <li
              key={name}
              className="rounded-xl bg-white px-5 py-4 text-sm text-zinc-800 ring-1 ring-black/[.06] dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/[.08]"
            >
              {name}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
