import fs from "fs";
import path from "path";

const HOOK_PATH = path.join(".git", "hooks", "post-commit");
const HOOK_MARKER = "# xanther-cli auto-sync";

const HOOK_CONTENT = `#!/bin/sh
${HOOK_MARKER}
# Auto-sync changes to Xanther after each commit
# Runs in background so it doesn't slow down your workflow
npx xanther-cli sync &
`;

/**
 * Install the post-commit git hook for auto-sync.
 */
export function installHook(): void {
  if (!fs.existsSync(".git")) {
    throw new Error("Not a git repository");
  }

  const hooksDir = path.join(".git", "hooks");
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  if (fs.existsSync(HOOK_PATH)) {
    const existing = fs.readFileSync(HOOK_PATH, "utf-8");
    if (existing.includes(HOOK_MARKER)) {
      return; // Already installed
    }
    // Append to existing hook
    fs.appendFileSync(HOOK_PATH, `\n${HOOK_CONTENT}`);
  } else {
    fs.writeFileSync(HOOK_PATH, HOOK_CONTENT);
  }

  fs.chmodSync(HOOK_PATH, "755");
}

/**
 * Remove the xanther hook from post-commit.
 */
export function removeHook(): void {
  if (!fs.existsSync(HOOK_PATH)) return;

  const content = fs.readFileSync(HOOK_PATH, "utf-8");
  if (!content.includes(HOOK_MARKER)) return;

  // Remove the xanther section
  const lines = content.split("\n");
  const filtered = lines.filter(
    (line) => !line.includes(HOOK_MARKER) && !line.includes("xanther-cli sync")
  );

  const cleaned = filtered.join("\n").trim();
  if (cleaned === "#!/bin/sh" || cleaned === "") {
    fs.unlinkSync(HOOK_PATH);
  } else {
    fs.writeFileSync(HOOK_PATH, cleaned + "\n");
  }
}
