import { loadConfig } from "./config.js";

const DEFAULT_API_BASE = "https://api.xanther.ai";

function getApiBase(): string {
  const config = loadConfig();
  return config?.api_url || DEFAULT_API_BASE;
}

export async function checkRepo(
  apiKey: string,
  repoUrl: string
): Promise<{ indexed: boolean; repo_id: string; node_count: number; source: string }> {
  const res = await fetch(
    `${getApiBase()}/repos/check?url=${encodeURIComponent(repoUrl)}`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Check failed (${res.status})`);
  }

  return res.json();
}

export async function triggerIndex(
  apiKey: string,
  repoUrl: string,
  branch: string
): Promise<{ jobId: string; repoId: string }> {
  const res = await fetch(`${getApiBase()}/repos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo_url: repoUrl,
      branch,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Index trigger failed (${res.status})`);
  }

  const data = await res.json();
  return { jobId: data.job_id, repoId: data.repo_id };
}

export async function listRepos(apiKey: string): Promise<Array<{
  job_id: string;
  repo_id: string;
  repo_url: string;
  branch: string;
  status: string;
  progress_pct: number;
  node_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}>> {
  const res = await fetch(`${getApiBase()}/repos`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `List repos failed (${res.status})`);
  }

  return res.json();
}

export async function getUsage(apiKey: string): Promise<{
  current: {
    period: string;
    queries_used: number;
    credits_used: number;
  };
}> {
  const res = await fetch(`${getApiBase()}/usage`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Usage check failed (${res.status})`);
  }

  return res.json();
}
