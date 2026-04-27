import chalk from "chalk";
import ora from "ora";
import { saveConfig, getRepoName } from "../utils/config.js";
import { uploadRepo } from "../utils/upload.js";
import { installHook } from "../utils/hook.js";
import { triggerIndex } from "../utils/api.js";

interface InitOptions {
  apiKey: string;
  branch: string;
  hook: boolean;
}

export async function initCommand(options: InitOptions) {
  console.log(chalk.bold("\n  Xanther CLI — Initialize\n"));

  const repoName = getRepoName();
  console.log(`  Repository: ${chalk.cyan(repoName)}`);
  console.log(`  Branch:     ${chalk.cyan(options.branch)}\n`);

  // Save config
  saveConfig({
    api_key: options.apiKey,
    api_url: "https://api.xanther.ai",
    branch: options.branch,
  });

  // Upload repo
  const spinner = ora("Uploading codebase...").start();
  try {
    const { fileCount, sizeBytes } = await uploadRepo(options.apiKey);
    spinner.succeed(
      `Uploaded ${fileCount} files (${(sizeBytes / 1024 / 1024).toFixed(1)} MB)`
    );
  } catch (err: any) {
    spinner.fail(`Upload failed: ${err.message}`);
    process.exit(1);
  }

  // Trigger indexing
  const indexSpinner = ora("Triggering indexing...").start();
  try {
    const { jobId } = await triggerIndex(options.apiKey, repoName, options.branch);
    indexSpinner.succeed(`Indexing started (job: ${jobId})`);
  } catch (err: any) {
    indexSpinner.fail(`Indexing failed: ${err.message}`);
    process.exit(1);
  }

  // Install git hook
  if (options.hook) {
    const hookSpinner = ora("Installing post-commit hook...").start();
    try {
      installHook();
      hookSpinner.succeed("Git hook installed");
    } catch (err: any) {
      hookSpinner.warn(`Hook install skipped: ${err.message}`);
    }
  }

  console.log(
    `\n  ${chalk.green("Done!")} Your repo is being indexed.\n` +
      `  Check status: ${chalk.cyan("xanther-cli status")}\n` +
      `  Connect agent: ${chalk.cyan("https://github.com/Xanther-Ai/xce-mcp")}\n`
  );
}
