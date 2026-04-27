import chalk from "chalk";
import ora from "ora";
import { loadConfig, getRepoName } from "../utils/config.js";
import { getChangedFiles, uploadFiles } from "../utils/upload.js";
import { triggerIncrementalIndex } from "../utils/api.js";

interface SyncOptions {
  full?: boolean;
}

export async function syncCommand(options: SyncOptions) {
  const config = loadConfig();
  if (!config) {
    console.log(chalk.red("\n  Not initialized. Run: xanther-cli init --api-key <key>\n"));
    process.exit(1);
  }

  const repoName = getRepoName();
  console.log(chalk.bold(`\n  Xanther CLI — Sync (${repoName})\n`));

  if (options.full) {
    console.log("  Mode: Full re-index\n");
    // Same as init upload flow
  } else {
    const spinner = ora("Finding changed files...").start();
    const changedFiles = await getChangedFiles(config.last_commit);
    if (changedFiles.length === 0) {
      spinner.succeed("No changes since last sync");
      return;
    }
    spinner.succeed(`${changedFiles.length} files changed`);

    const uploadSpinner = ora("Uploading changes...").start();
    await uploadFiles(config.api_key, changedFiles);
    uploadSpinner.succeed("Changes uploaded");

    const indexSpinner = ora("Triggering incremental index...").start();
    await triggerIncrementalIndex(config.api_key, repoName, changedFiles);
    indexSpinner.succeed("Incremental index started");
  }

  console.log(chalk.green("\n  Sync complete.\n"));
}
