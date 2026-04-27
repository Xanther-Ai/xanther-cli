import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import archiver from "archiver";
import ignore from "ignore";

const API_BASE = "https://api.xanther.ai";

/**
 * Upload the entire repo as a zip (respecting .gitignore).
 */
export async function uploadRepo(apiKey: string): Promise<{ fileCount: number; sizeBytes: number }> {
  const files = getTrackedFiles();
  const zipBuffer = await createZip(files);

  const res = await fetch(`${API_BASE}/repos/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/zip",
    },
    body: zipBuffer,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Upload failed");
  }

  return { fileCount: files.length, sizeBytes: zipBuffer.byteLength };
}

/**
 * Upload only specific changed files.
 */
export async function uploadFiles(apiKey: string, files: string[]): Promise<void> {
  const zipBuffer = await createZip(files);

  const res = await fetch(`${API_BASE}/repos/upload-incremental`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/zip",
    },
    body: zipBuffer,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Upload failed");
  }
}

/**
 * Get files changed since a specific commit.
 */
export async function getChangedFiles(sinceCommit?: string): Promise<string[]> {
  try {
    const ref = sinceCommit || "HEAD~1";
    const output = execSync(`git diff --name-only ${ref} HEAD`, { encoding: "utf-8" });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Get all git-tracked files (respects .gitignore).
 */
function getTrackedFiles(): string[] {
  try {
    const output = execSync("git ls-files", { encoding: "utf-8" });
    return output.trim().split("\n").filter(Boolean);
  } catch {
    // Fallback: walk directory with .gitignore
    return walkWithIgnore(".");
  }
}

function walkWithIgnore(dir: string): string[] {
  const ig = ignore.default();
  if (fs.existsSync(".gitignore")) {
    ig.add(fs.readFileSync(".gitignore", "utf-8"));
  }
  ig.add([".git", "node_modules", ".xanther"]);

  const files: string[] = [];
  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = path.join(d, entry.name);
      if (ig.ignores(rel)) continue;
      if (entry.isDirectory()) walk(rel);
      else files.push(rel);
    }
  }
  walk(dir);
  return files;
}

async function createZip(files: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const file of files) {
      if (fs.existsSync(file)) {
        archive.file(file, { name: file });
      }
    }
    archive.finalize();
  });
}
