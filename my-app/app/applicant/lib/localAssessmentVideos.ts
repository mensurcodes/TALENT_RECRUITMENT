import path from "node:path";
import fs from "node:fs/promises";

/**
 * When set (absolute path or path relative to process.cwd()), assessment WebM clips
 * are written here in addition to (or instead of) Supabase Storage.
 */
export function getLocalAssessmentVideoRoot(): string | null {
  const raw = process.env.ASSESSMENT_VIDEO_LOCAL_DIR?.trim();
  if (!raw) return null;
  return path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw);
}

export function resolveLocalVideoFile(root: string, objectPath: string): string {
  const segments = objectPath.split("/").filter(Boolean);
  if (segments.some((s) => s === ".." || s.includes(".."))) {
    throw new Error("Invalid path");
  }
  const resolvedRoot = path.resolve(root);
  const full = path.resolve(path.join(resolvedRoot, ...segments));
  const prefix = resolvedRoot.endsWith(path.sep) ? resolvedRoot : `${resolvedRoot}${path.sep}`;
  if (full !== resolvedRoot && !full.startsWith(prefix)) {
    throw new Error("Invalid path");
  }
  return full;
}

export async function saveLocalAssessmentVideo(
  root: string,
  objectPath: string,
  data: Buffer,
): Promise<void> {
  const full = resolveLocalVideoFile(root, objectPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
}

export async function localAssessmentVideoExists(root: string, objectPath: string): Promise<boolean> {
  try {
    const full = resolveLocalVideoFile(root, objectPath);
    await fs.access(full);
    return true;
  } catch {
    return false;
  }
}
