export function SupabaseNotice() {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
      <p className="font-medium text-amber-50">Supabase env vars missing</p>
      <p className="mt-2 text-amber-100/90">
        Add <code className="rounded bg-black/30 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">my-app/.env.local</code>, then restart{" "}
        <code className="rounded bg-black/30 px-1 py-0.5">npm run dev</code>.
      </p>
    </div>
  );
}
