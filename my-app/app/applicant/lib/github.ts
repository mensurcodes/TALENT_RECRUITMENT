export type GithubContext = {
  owner: string;
  repo: string;
  description: string | null;
  language: string | null;
  topics: string[];
  readmeExcerpt: string;
  defaultBranch: string | null;
  /** Sample of file paths discovered in the default branch (public tree). */
  fileTreeSample: string[];
  /** Concatenated excerpts from public repo source files (when API allows). */
  codeSnippetsDigest: string;
  /** True when we walked the git tree + fetched file contents (may be partial if truncated). */
  codebaseIndexed: boolean;
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

const SKIP_DIR = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "vendor",
  "__pycache__",
  ".venv",
  "venv",
  "target",
  ".turbo",
  ".cache",
]);

const SKIP_EXT = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".mp4",
  ".mp3",
  ".lock",
]);

const PRIORITY_FILES = [
  "package.json",
  "pnpm-workspace.yaml",
  "turbo.json",
  "go.mod",
  "Cargo.toml",
  "requirements.txt",
  "pyproject.toml",
  "setup.py",
  "Gemfile",
  "composer.json",
  "pom.xml",
  "build.gradle",
  "Dockerfile",
  "docker-compose.yml",
  "Makefile",
  "tsconfig.json",
  "next.config.ts",
  "next.config.js",
  "vite.config.ts",
  "tailwind.config.ts",
];

const SOURCE_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".vue",
  ".svelte",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".swift",
  ".rb",
  ".php",
  ".cs",
  ".scala",
  ".clj",
  ".ex",
  ".exs",
  ".md",
  ".sql",
  ".graphql",
  ".yml",
  ".yaml",
]);

const MAX_TREE_PATHS_LIST = 120;
const MAX_FILES_TO_FETCH = 22;
const MAX_BYTES_PER_FILE = 14_000;
const MAX_TOTAL_SNIPPET_CHARS = 18_000;

function shouldSkipPath(path: string): boolean {
  const lower = path.toLowerCase();
  const segments = path.split("/");
  for (const seg of segments) {
    if (SKIP_DIR.has(seg)) return true;
    if (seg === ".env" || seg.startsWith(".env.")) return true;
    if ([".vscode", ".idea", ".husky", ".terraform"].includes(seg)) return true;
  }
  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot) : "";
  if (ext && SKIP_EXT.has(ext)) return true;
  if (lower.endsWith(".min.js") || lower.endsWith(".bundle.js")) return true;
  return false;
}

function filePriority(path: string): number {
  const base = path.split("/").pop() ?? path;
  const idx = PRIORITY_FILES.indexOf(base);
  if (idx >= 0) return idx;
  const lower = path.toLowerCase();
  if (lower.startsWith("src/") || lower.startsWith("app/") || lower.startsWith("lib/"))
    return 100 + path.length * 0.001;
  if (lower.startsWith("components/") || lower.startsWith("pages/")) return 105;
  return 200 + path.length * 0.001;
}

type TreeBlob = { path: string; type: string; size?: number };

function pickPathsForFetch(blobs: TreeBlob[]): string[] {
  const candidates = blobs.filter(
    (b) => b.type === "blob" && b.path && !shouldSkipPath(b.path),
  );
  const withExt = candidates.filter((b) => {
    const dot = b.path.lastIndexOf(".");
    const ext = dot >= 0 ? b.path.slice(dot).toLowerCase() : "";
    return SOURCE_EXT.has(ext) || PRIORITY_FILES.includes(b.path.split("/").pop() ?? "");
  });

  withExt.sort((a, b) => filePriority(a.path) - filePriority(b.path));

  const picked: string[] = [];
  for (const b of withExt) {
    if (picked.length >= MAX_FILES_TO_FETCH) break;
    const sz = typeof b.size === "number" ? b.size : 0;
    if (sz > MAX_BYTES_PER_FILE) continue;
    picked.push(b.path);
  }
  return picked;
}

async function fetchBlobContent(
  base: string,
  branch: string,
  path: string,
  headers: HeadersInit,
): Promise<string | null> {
  const enc = path
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  const url = `${base}/contents/${enc}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers, next: { revalidate: 300 } });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; encoding?: string; type?: string };
  if (data.type !== "file" || !data.content || data.encoding !== "base64") return null;
  try {
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  } catch {
    return null;
  }
}

async function fetchLanguages(
  base: string,
  headers: HeadersInit,
): Promise<Record<string, number> | null> {
  const res = await fetch(`${base}/languages`, { headers, next: { revalidate: 600 } });
  if (!res.ok) return null;
  return (await res.json()) as Record<string, number>;
}

export async function fetchGithubContext(url: string): Promise<GithubContext | null> {
  const parsed = parseGithubRepo(url);
  if (!parsed) return null;
  const { owner, repo } = parsed;
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "TalentApplicantPortal/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
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

    const defaultBranch = meta.default_branch ?? "main";

    let readmeExcerpt = "";
    const readmeRes = await fetch(`${base}/readme`, { headers, next: { revalidate: 300 } });
    if (readmeRes.ok) {
      const readme = (await readmeRes.json()) as { content?: string; encoding?: string };
      if (readme.content && readme.encoding === "base64") {
        const decoded = Buffer.from(readme.content, "base64").toString("utf8");
        readmeExcerpt = decoded.slice(0, 6000);
      }
    }

    let fileTreeSample: string[] = [];
    let codeSnippetsDigest = "";
    let codebaseIndexed = false;

    const refRes = await fetch(
      `${base}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
      { headers, next: { revalidate: 300 } },
    );
    if (refRes.ok) {
      const refData = (await refRes.json()) as { object?: { sha?: string } };
      const commitSha = refData.object?.sha;
      if (commitSha) {
        const commitRes = await fetch(`${base}/git/commits/${commitSha}`, {
          headers,
          next: { revalidate: 300 },
        });
        if (commitRes.ok) {
          const commitJson = (await commitRes.json()) as { tree?: { sha?: string } };
          const treeSha = commitJson.tree?.sha;
          if (treeSha) {
            const treeRes = await fetch(`${base}/git/trees/${treeSha}?recursive=1`, {
              headers,
              next: { revalidate: 300 },
            });
            if (treeRes.ok) {
              const treeJson = (await treeRes.json()) as {
                tree?: TreeBlob[];
                truncated?: boolean;
              };
              const tree = treeJson.tree ?? [];
              const blobs = tree.filter((t): t is TreeBlob => Boolean(t.path && t.type));
              const paths = blobs
                .filter((b) => b.type === "blob" && !shouldSkipPath(b.path))
                .map((b) => b.path)
                .sort();
              fileTreeSample = paths.slice(0, MAX_TREE_PATHS_LIST);
              if (treeJson.truncated && fileTreeSample.length > 0) {
                fileTreeSample.push("… (tree truncated by GitHub — listing partial)");
              }

              const toFetch = pickPathsForFetch(blobs);
              const snippets: string[] = [];
              let total = 0;
              const batchSize = 5;
              for (let i = 0; i < toFetch.length; i += batchSize) {
                const batch = toFetch.slice(i, i + batchSize);
                const contents = await Promise.all(
                  batch.map((p) => fetchBlobContent(base, defaultBranch, p, headers)),
                );
                for (let j = 0; j < batch.length; j++) {
                  const text = contents[j];
                  if (!text) continue;
                  const excerpt = text.slice(0, Math.min(3500, MAX_BYTES_PER_FILE));
                  const block = `--- FILE: ${batch[j]} ---\n${excerpt}`;
                  if (total + block.length > MAX_TOTAL_SNIPPET_CHARS) break;
                  snippets.push(block);
                  total += block.length;
                }
                if (total >= MAX_TOTAL_SNIPPET_CHARS) break;
              }
              codeSnippetsDigest = snippets.join("\n\n");
              codebaseIndexed = toFetch.length > 0 || fileTreeSample.length > 0;
            }
          }
        }
      }
    }

    const langs = await fetchLanguages(base, headers);
    let language = meta.language ?? null;
    if (langs && Object.keys(langs).length > 0) {
      const sorted = Object.entries(langs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([k, v]) => `${k} (${v.toLocaleString()} bytes)`)
        .join(", ");
      language = language ? `${language} · ${sorted}` : sorted;
    }

    return {
      owner,
      repo,
      description: meta.description ?? null,
      language,
      topics: Array.isArray(meta.topics) ? meta.topics : [],
      readmeExcerpt,
      defaultBranch,
      fileTreeSample,
      codeSnippetsDigest,
      codebaseIndexed,
    };
  } catch {
    return null;
  }
}
