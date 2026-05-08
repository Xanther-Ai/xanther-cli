import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG_DIR = ".xanther";
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface XantherConfig {
  api_key: string;
  api_url: string;
  repo_id?: string;
  repo_url?: string;
  branch?: string;
  last_sync?: string;
  last_commit?: string;
}

export function saveConfig(config: Partial<XantherConfig>): void {
  const existing = loadConfig() || {};
  const merged = { ...existing, ...config };
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));

  // Add to .gitignore if not already there
  const gitignore = fs.existsSync(".gitignore") ? fs.readFileSync(".gitignore", "utf-8") : "";
  if (!gitignore.includes(".xanther/")) {
    fs.appendFileSync(".gitignore", "\n# Xanther CLI config (contains API key)\n.xanther/\n");
  }
}

export function loadConfig(): XantherConfig | null {
  if (!fs.existsSync(CONFIG_FILE)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

export function removeConfig(): void {
  if (fs.existsSync(CONFIG_DIR)) {
    fs.rmSync(CONFIG_DIR, { recursive: true });
  }
}

export function getRepoName(): string {
  try {
    const remote = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    const match = remote.match(/\/([^/]+?)(?:\.git)?$/);
    return match ? match[1] : path.basename(process.cwd());
  } catch {
    return path.basename(process.cwd());
  }
}

export function getRepoUrl(): string | null {
  try {
    const remote = execSync("git remote get-url origin", { encoding: "utf-8" }).trim();
    // Convert SSH URLs to HTTPS
    if (remote.startsWith("git@")) {
      return remote.replace("git@github.com:", "https://github.com/").replace(/\.git$/, "");
    }
    return remote.replace(/\.git$/, "");
  } catch {
    return null;
  }
}
