# Xanther CLI

<p align="center">
  <img src="assets/xanther-cli-banner.png" alt="Xanther CLI" width="700" />
</p>

<p align="center">
  <strong>Index your codebase. Supercharge your coding agent.</strong>
</p>

<p align="center">
  <a href="https://xanther.ai">Website</a> •
  <a href="https://app.xanther.ai">Dashboard</a> •
  <a href="https://discord.gg/Y768kBRS">Discord</a> •
  <a href="https://github.com/Xanther-Ai/xce-mcp">XCE MCP Server</a>
</p>

---

## What is Xanther CLI?

Xanther CLI indexes your codebase into the Xanther Context Engine (XCE), giving your coding agent deep architectural understanding of your code. It works with any git repository — public, private, GitHub, GitLab, Bitbucket, or local-only.

## Install

```bash
npm install -g xanther-cli
```

Or use directly with npx:

```bash
npx xanther-cli init --api-key xce_your_key_here
```

## Quick Start

### 1. Get your API key

Sign up at [xanther.ai/signup](https://xanther.ai/signup) and generate an API key from the [dashboard](https://app.xanther.ai).

### 2. Initialize and index your repo

```bash
cd your-project
npx xanther-cli init --api-key xce_your_key_here
```

This does three things:
1. Uploads your codebase (respecting `.gitignore`)
2. Triggers full indexing (AST parsing, embeddings, architecture docs)
3. Installs a `post-commit` git hook for automatic incremental updates

### 3. Connect your coding agent

Add XCE to your agent's MCP config — see [XCE MCP Server](https://github.com/Xanther-Ai/xce-mcp) for setup instructions.

That's it. Your agent now has deep codebase context on every interaction.

## Commands

### `xanther-cli init`

Initialize and perform a full index of the current repository.

```bash
xanther-cli init --api-key xce_your_key_here
```

Options:
- `--api-key` — Your Xanther API key (required on first run, saved for future use)
- `--branch` — Branch to index (default: current branch)
- `--no-hook` — Skip installing the git post-commit hook

### `xanther-cli sync`

Manually sync changes since the last index. Performs incremental indexing — only changed files are re-processed.

```bash
xanther-cli sync
```

Options:
- `--full` — Force a full re-index instead of incremental

### `xanther-cli status`

Check the indexing status of the current repository.

```bash
xanther-cli status
```

Output:
```
Repository: owner/my-project (main)
Status:     Indexed
Nodes:      12,450
Last sync:  2 hours ago
Plan:       Pro (8,234 / 10,000 queries used)
```

### `xanther-cli uninstall`

Remove the git hook and local configuration.

```bash
xanther-cli uninstall
```

## How Auto-Sync Works

When you run `xanther-cli init`, it installs a `post-commit` git hook:

```
git commit → post-commit hook fires → xanther-cli sync --incremental (background)
```

The incremental sync:
1. Gets changed files from the commit (`git diff --name-only HEAD~1`)
2. Uploads only those files
3. Re-indexes affected graph nodes (the changed files + their dependencies)

This runs in the background and typically takes 2-5 seconds for a normal commit.

## Configuration

Xanther CLI stores its config in `.xanther/config.json` in your project root:

```json
{
  "api_key": "xce_...",
  "repo_id": "user-id:my-project",
  "api_url": "https://api.xanther.ai",
  "last_sync": "2026-04-26T10:00:00Z",
  "last_commit": "abc123"
}
```

Add `.xanther/` to your `.gitignore` — it contains your API key.

## Works Everywhere

| Git Host | Supported | Auto-update |
|---|---|---|
| GitHub (public) | Yes | post-commit hook |
| GitHub (private) | Yes | post-commit hook |
| GitLab | Yes | post-commit hook |
| Bitbucket | Yes | post-commit hook |
| Self-hosted git | Yes | post-commit hook |
| Local (no remote) | Yes | post-commit hook |

## Privacy

- Your code is uploaded over HTTPS to Xanther's servers for indexing
- Code is processed and stored as graph nodes (not raw source)
- `.gitignore` patterns are respected — ignored files are never uploaded
- You can delete your indexed data anytime from the [dashboard](https://app.xanther.ai)

## Links

- [XCE MCP Server](https://github.com/Xanther-Ai/xce-mcp) — Connect your coding agent
- [Xanther Website](https://xanther.ai) — Learn more
- [Dashboard](https://app.xanther.ai) — Manage repos, API keys, usage
- [Discord](https://discord.gg/Y768kBRS) — Community and support
- [Benchmark Results](https://xanther.ai/benchmarks) — SWE-bench performance data

## License

MIT — see [LICENSE](LICENSE) for details.
