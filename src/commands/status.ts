import chalk from "chalk";
import { loadConfig, getRepoName } from "../utils/config.js";
import { getRepoStatus } from "../utils/api.js";

export async function statusCommand() {
  const config = loadConfig();
  if (!config) {
    console.log(chalk.red("\n  Not initialized. Run: xanther-cli init --api-key <key>\n"));
    process.exit(1);
  }

  const repoName = getRepoName();
  console.log(chalk.bold(`\n  Xanther CLI — Status\n`));

  try {
    const status = await getRepoStatus(config.api_key, repoName);
    console.log(`  Repository: ${chalk.cyan(repoName)}`);
    console.log(`  Status:     ${formatStatus(status.status)}`);
    console.log(`  Nodes:      ${chalk.white(status.node_count.toLocaleString())}`);
    console.log(`  Last sync:  ${chalk.gray(status.last_sync || "never")}`);
    console.log(`  Plan:       ${chalk.white(status.tier)} (${status.queries_used}/${status.queries_limit} queries)\n`);
  } catch (err: any) {
    console.log(chalk.red(`  Error: ${err.message}\n`));
    process.exit(1);
  }
}

function formatStatus(status: string): string {
  switch (status) {
    case "completed": return chalk.green("Indexed");
    case "queued": return chalk.yellow("Queued");
    case "cloning": return chalk.blue("Cloning");
    case "parsing": return chalk.blue("Parsing");
    case "embedding": return chalk.blue("Embedding");
    case "documenting": return chalk.blue("Documenting");
    case "storing": return chalk.blue("Storing");
    case "failed": return chalk.red("Failed");
    default: return chalk.gray(status);
  }
}
