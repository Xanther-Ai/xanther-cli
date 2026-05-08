import chalk from "chalk";
import ora from "ora";
import fs from "fs";
import path from "path";
import { saveConfig, getRepoUrl, getRepoName } from "../utils/config.js";
import { triggerIndex, checkRepo } from "../utils/api.js";
import { installHook } from "../utils/hook.js";

interface InitOptions {
  apiKey: string;
  branch: string;
  repo?: string;
  hook: boolean;
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.bold("\n  Xanther CLI — Initialize\n"));

  // Determine repo URL
  const repoUrl = options.repo || getRepoUrl();
  if (!repoUrl) {
    console.error(
      chalk.red("  Error: Could not detect repository URL.\n") +
      `  Either run this from a git repo with a remote, or pass --repo <url>\n`
    );
    process.exit(1);
  }

  const repoName = getRepoName();
  console.log(`  Repository: ${chalk.cyan(repoUrl)}`);
  console.log(`  Branch:     ${chalk.cyan(options.branch)}\n`);

  // Save config
  saveConfig({
    api_key: options.apiKey,
    api_url: "https://api.xanther.ai",
    branch: options.branch,
    repo_url: repoUrl,
  });

  // Check if repo is already indexed (community or user's own)
  const checkSpinner = ora("Checking if repo is already indexed...").start();
  let repoId: string | null = null;
  let alreadyIndexed = false;

  try {
    const check = await checkRepo(options.apiKey, repoUrl);
    if (check.indexed) {
      repoId = check.repo_id;
      alreadyIndexed = true;
      checkSpinner.succeed(
        `Already indexed as ${chalk.cyan(check.source)} repo (${check.node_count.toLocaleString()} nodes)`
      );
    } else {
      checkSpinner.info("Not yet indexed — submitting for indexing");
    }
  } catch {
    checkSpinner.info("Could not check — will submit for indexing");
  }

  // If not already indexed, trigger indexing
  if (!alreadyIndexed) {
    const spinner = ora("Submitting repository for indexing...").start();
    try {
      const result = await triggerIndex(options.apiKey, repoUrl, options.branch);
      repoId = result.repoId;
      saveConfig({ repo_id: repoId });
      spinner.succeed(`Indexing started (job: ${chalk.dim(result.jobId)})`);
    } catch (err: any) {
      spinner.fail(`Indexing failed: ${err.message}`);
      if (err.message.includes("limit")) {
        console.log(chalk.yellow("\n  Upgrade your plan at https://app.xanther.ai/billing\n"));
      }
      process.exit(1);
    }
  } else {
    saveConfig({ repo_id: repoId! });
  }

  // Install git post-commit hook for auto-sync
  if (options.hook !== false && !alreadyIndexed) {
    const hookSpinner = ora("Installing post-commit hook...").start();
    try {
      installHook();
      hookSpinner.succeed("Git hook installed (auto-sync on commit)");
    } catch (err: any) {
      hookSpinner.warn(`Hook skipped: ${err.message}`);
    }
  }

  // Generate steering files
  if (repoId) {
    const steeringSpinner = ora("Generating steering files...").start();
    try {
      generateSteeringFiles(repoId, options.apiKey);
      steeringSpinner.succeed("Steering files generated");
    } catch (err: any) {
      steeringSpinner.warn(`Steering generation skipped: ${err.message}`);
    }
  }

  // Print next steps
  console.log(
    `\n  ${chalk.green("Done!")} ${alreadyIndexed ? "Repo is ready." : "Your repo is being indexed."}\n\n` +
    `  ${chalk.bold("Add to your agent's MCP config:")}\n\n` +
    chalk.dim(`    {\n`) +
    chalk.dim(`      "mcpServers": {\n`) +
    chalk.dim(`        "xanther-xce": {\n`) +
    chalk.dim(`          "url": "https://mcp.xanther.ai/sse?repo_id=${encodeURIComponent(repoId || "")}",\n`) +
    chalk.dim(`          "headers": { "Authorization": "Bearer ${options.apiKey}" }\n`) +
    chalk.dim(`        }\n`) +
    chalk.dim(`      }\n`) +
    chalk.dim(`    }\n\n`) +
    `  The repo_id is embedded in the URL — your agent will automatically\n` +
    `  query the correct repo without needing steering files.\n\n` +
    `  Check status:    ${chalk.cyan("npx xanther-cli status")}\n` +
    `  Dashboard:       ${chalk.cyan("https://app.xanther.ai")}\n`
  );
}

function generateSteeringFiles(repoId: string, apiKey: string) {
  const steeringContent = `Always use the xanther-xce MCP tools for codebase understanding before reading files directly.
When calling XCE tools, always pass repo_id: "${repoId}"

- Call xce_get_context with repo_id="${repoId}" as your FIRST step on any task
- Use xce_architecture_context with repo_id="${repoId}" before modifying any file
- Use xce_impact_analysis with repo_id="${repoId}" before multi-file changes
- Use xce_search with repo_id="${repoId}" to find code by meaning instead of grep
- Use xce_trace with repo_id="${repoId}" to understand architectural relationships

Prefer XCE context over file reading for understanding code structure.`;

  // .xanther/agent-instructions.md (universal — copy to any agent's rules file)
  fs.mkdirSync(".xanther", { recursive: true });
  fs.writeFileSync(
    ".xanther/agent-instructions.md",
    `# Xanther XCE — Agent Instructions\n\n` +
    `Copy this content into your agent's rules file if it wasn't auto-detected.\n\n` +
    `- Kiro: .kiro/steering/xce.md\n` +
    `- Claude Code: CLAUDE.md\n` +
    `- Cursor: .cursorrules\n` +
    `- Windsurf: .windsurfrules\n` +
    `- Cline: .clinerules\n\n` +
    `---\n\n${steeringContent}\n`
  );

  // Kiro steering
  const kiroDir = ".kiro/steering";
  fs.mkdirSync(kiroDir, { recursive: true });
  fs.writeFileSync(
    path.join(kiroDir, "xce.md"),
    `---\ninclusion: auto\n---\n${steeringContent}\n`
  );

  // CLAUDE.md (Claude Code)
  writeOrAppend("CLAUDE.md", `## Codebase Context (XCE)\n\n${steeringContent}\n`);

  // .cursorrules (Cursor)
  writeOrAppend(".cursorrules", steeringContent + "\n");

  // .windsurfrules (Windsurf)
  writeOrAppend(".windsurfrules", steeringContent + "\n");

  // .clinerules (Cline)
  writeOrAppend(".clinerules", steeringContent + "\n");
}

function writeOrAppend(filepath: string, content: string) {
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, content);
  } else {
    const existing = fs.readFileSync(filepath, "utf-8");
    if (!existing.includes("xce_get_context")) {
      fs.appendFileSync(filepath, `\n\n${content}`);
    }
  }
}
