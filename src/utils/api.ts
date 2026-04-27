const API_BASE = "https://api.xanther.ai";

export async function triggerIndex(
  apiKey: string,
  repoName: string,
  branch: string
): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/repos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo_url: `local://${repoName}`,
      branch,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Index trigger failed");
  }

  const data = await res.json();
  return { jobId: data.job_id };
}

export async function triggerIncrementalIndex(
  apiKey: string,
  repoName: string,
  changedFiles: string[]
): Promise<void> {
  const res = await fetch(`${API_BASE}/repos/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      repo_name: repoName,
      changed_files: changedFiles,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Incremental index failed");
  }
}

export async function getRepoStatus(
  apiKey: string,
  repoName: string
): Promise<{
  status: string;
  node_count: number;
  last_sync: string;
  tier: string;
  queries_used: number;
  queries_limit: number;
}> {
  const res = await fetch(`${API_BASE}/repos/${repoName}/status`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || "Status check failed");
  }

  return res.json();
}
