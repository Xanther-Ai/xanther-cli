import chalk from "chalk";
import ora from "ora";
import { loadConfig, getRepoUrl } from "../utils/config.js";
import { triggerIndex } from "../utils/api.js";

interface SyncOptions {
  full?: boolean;
}

export async function syncCommand(options: SyncOptions) {
  const config = loadConfig();
  if (!config?.api_key) {
    console.error(chalk.red("\n  Not initialized. Run: xanther-cli init --api-key <key>\n"));
    process.exit(1);
  }

  console.log(chalk.bold("\n  Xanther CLI — Sync\n"));

  const repoUrl = config.repo_url || getRepoUrl();
  if (!repoUrl) {
    console.error(chalk.red("  Error: No repository URL configured.\n"));
    process.exit(1);
  }

  const branch = config.branch || "main";
  console.log(`  Repository: ${chalk.cyan(repoUrl)}`);
  console.log(`  Branch:     ${chalk.cyan(branch)}\n`);

  const spinner = ora("Triggering re-index...").start();
  try {
    const { jobId } = await triggerIndex(config.api_key, repoUrl, branch);
    spinner.succeed(`Re-index started (job: ${chalk.dim(jobId)})`);
    console.log(`\n  Check progress: ${chalk.cyan("npx xanther-cli status")}\n`);
  } catch (err: any) {
    spinner.fail(`Sync failed: ${err.message}`);
    process.exit(1);
  }
}
