import chalk from "chalk";
import { removeHook } from "../utils/hook.js";
import { removeConfig } from "../utils/config.js";

export async function uninstallCommand() {
  console.log(chalk.bold("\n  Xanther CLI — Uninstall\n"));

  removeHook();
  console.log("  Removed git hook");

  removeConfig();
  console.log("  Removed local config");

  console.log(chalk.green("\n  Uninstalled. Your indexed data remains on the server.\n"));
  console.log(`  To delete indexed data, visit: ${chalk.cyan("https://app.xanther.ai")}\n`);
}
