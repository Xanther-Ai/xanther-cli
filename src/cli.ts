#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { syncCommand } from "./commands/sync.js";
import { statusCommand } from "./commands/status.js";
import { uninstallCommand } from "./commands/uninstall.js";

const program = new Command();

program
  .name("xanther-cli")
  .description("Index your codebase and supercharge your coding agent")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize and perform a full index of the current repository")
  .requiredOption("--api-key <key>", "Your Xanther API key")
  .option("--branch <branch>", "Branch to index", "main")
  .option("--no-hook", "Skip installing the git post-commit hook")
  .action(initCommand);

program
  .command("sync")
  .description("Sync changes since the last index")
  .option("--full", "Force a full re-index")
  .action(syncCommand);

program
  .command("status")
  .description("Check the indexing status of the current repository")
  .action(statusCommand);

program
  .command("uninstall")
  .description("Remove the git hook and local configuration")
  .action(uninstallCommand);

program.parse();
