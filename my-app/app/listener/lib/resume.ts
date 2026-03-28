const MAX_CHARS = 12_000;

export async function fetchResumeExcerpt(url: string): Promise<string> {
  if (!url.trim()) return "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "TalentListenerPortal/1.0",
        Accept: "text/html,text/plain,application/pdf;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
      next: { revalidate: 0 },
    });
    if (!res.ok) return `[Could not fetch resume URL: HTTP ${res.status}]`;
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("application/pdf")) {
      return "[Resume is a PDF — enable a document parser in production. Using URL + job context only for this demo.]";
    }
    const text = await res.text();
    const stripped = text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ");
    const collapsed = stripped.replace(/\s+/g, " ").trim();
    return collapsed.slice(0, MAX_CHARS);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return `[Resume fetch error: ${msg}]`;
  }
}
