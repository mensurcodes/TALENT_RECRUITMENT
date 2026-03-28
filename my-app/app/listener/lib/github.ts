export type GithubContext = {
  owner: string;
  repo: string;
  description: string | null;
  language: string | null;
  topics: string[];
  readmeExcerpt: string;
  defaultBranch: string | null;
};

export function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo] = parts;
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

export async function fetchGithubContext(url: string): Promise<GithubContext | null> {
  const parsed = parseGithubRepo(url);
  if (!parsed) return null;
  const { owner, repo } = parsed;
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "TalentListenerPortal/1.0",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  try {
    const metaRes = await fetch(base, { headers, next: { revalidate: 300 } });
    if (!metaRes.ok) return null;
    const meta = (await metaRes.json()) as {
      description?: string | null;
      language?: string | null;
      topics?: string[];
      default_branch?: string;
    };

    let readmeExcerpt = "";
    const readmeRes = await fetch(`${base}/readme`, { headers, next: { revalidate: 300 } });
    if (readmeRes.ok) {
      const readme = (await readmeRes.json()) as { content?: string; encoding?: string };
      if (readme.content && readme.encoding === "base64") {
        const decoded = Buffer.from(readme.content, "base64").toString("utf8");
        readmeExcerpt = decoded.slice(0, 6000);
      }
    }

    return {
      owner,
      repo,
      description: meta.description ?? null,
      language: meta.language ?? null,
      topics: Array.isArray(meta.topics) ? meta.topics : [],
      readmeExcerpt,
      defaultBranch: meta.default_branch ?? null,
    };
  } catch {
    return null;
  }
}
