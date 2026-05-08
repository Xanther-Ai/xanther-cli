import chalk from "chalk";
import ora from "ora";
import { loadConfig } from "../utils/config.js";
import { listRepos, getUsage } from "../utils/api.js";

export async function statusCommand() {
  const config = loadConfig();
  if (!config?.api_key) {
    console.error(chalk.red("\n  Not initialized. Run: xanther-cli init --api-key <key>\n"));
    process.exit(1);
  }

  console.log(chalk.bold("\n  Xanther CLI — Status\n"));

  const spinner = ora("Fetching status...").start();

  try {
    const [repos, usage] = await Promise.all([
      listRepos(config.api_key),
      getUsage(config.api_key).catch(() => null),
    ]);

    spinner.stop();

    if (usage) {
      const used = usage.current.queries_used;
      console.log(`  Usage this month: ${chalk.cyan(used.toString())} queries\n`);
    }

    if (repos.length === 0) {
      console.log(`  No repositories indexed yet.\n`);
      return;
    }

    console.log(`  Repositories (${repos.length}):\n`);

    for (const repo of repos) {
      const statusColor = repo.status === "completed"
        ? chalk.green
        : repo.status === "failed"
          ? chalk.red
          : chalk.yellow;

      const statusStr = statusColor(repo.status.padEnd(12));
      const nodes = repo.node_count > 0 ? chalk.dim(` (${repo.node_count} nodes)`) : "";
      const progress = repo.status !== "completed" && repo.status !== "failed"
        ? chalk.dim(` ${repo.progress_pct}%`)
        : "";

      console.log(`    ${statusStr} ${chalk.cyan(repo.repo_url)}${nodes}${progress}`);

      if (repo.error_message) {
        console.log(`               ${chalk.red(repo.error_message)}`);
      }
    }

    console.log();
  } catch (err: any) {
    spinner.fail(`Status check failed: ${err.message}`);
    process.exit(1);
  }
}
