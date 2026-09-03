import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const bundleDir = join(root, "bundle");
const frontendDir = join(root, "frontend");
const outputDir = join(frontendDir, "dist", "snip-frontend", "browser");
const shouldPush = process.argv.includes("--push");
const isWindows = process.platform === "win32";

function run(command, args, cwd = root) {
  return execFileSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: isWindows && (command === "npm" || command === "npx"),
  });
}

function runQuiet(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    stdio: "ignore",
    shell: false,
  });
}

run("git", ["submodule", "update", "--init", "--remote", "backend", "frontend", "cli"]);

run("npm", ["install"], frontendDir);
run("npx", ["ng", "build"], frontendDir);

const indexFile = join(outputDir, "index.html");
if (!existsSync(indexFile)) {
  throw new Error(`Frontend build did not produce ${indexFile}`);
}

mkdirSync(bundleDir, { recursive: true });
for (const entry of readdirSync(bundleDir)) {
  if (entry !== ".git") rmSync(join(bundleDir, entry), { recursive: true, force: true });
}

cpSync(join(root, "backend", "server.js"), join(bundleDir, "server.js"));
cpSync(join(root, "cli", "cli.js"), join(bundleDir, "cli.js"));
cpSync(outputDir, join(bundleDir, "public"), { recursive: true });
writeFileSync(join(bundleDir, ".env"), "PUBLIC_DIR=./public\n");
writeFileSync(
  join(bundleDir, "package.json"),
  `${JSON.stringify({ name: "snip-bundle", private: true, scripts: { start: "bun server.js" } }, null, 2)}\n`,
);
writeFileSync(
  join(bundleDir, "Dockerfile"),
  "FROM oven/bun:1-alpine\nCOPY . .\nENV PORT=3000\nEXPOSE 3000\nCMD bun server.js\n",
);
writeFileSync(
  join(bundleDir, ".dockerignore"),
  ".git\nnode_modules\n*.log\n",
);
writeFileSync(
  join(bundleDir, "railway.json"),
  `${JSON.stringify({ builder: "DOCKERFILE" }, null, 2)}\n`,
);

function hasStagedChanges(cwd) {
  try {
    runQuiet("git", ["diff", "--cached", "--quiet"], cwd);
    return false;
  } catch (error) {
    if (error.status === 1) return true;
    throw error;
  }
}

run("git", ["add", "-A"], bundleDir);
if (hasStagedChanges(bundleDir)) {
  run("git", ["commit", "-m", "Generate bundle release"], bundleDir);
} else {
  console.log("bundle: unchanged, nothing to commit");
}
if (shouldPush) run("git", ["push", "origin", "HEAD:bundle"], bundleDir);

run("git", ["add", "backend", "frontend", "cli", "bundle"]);
if (hasStagedChanges(root)) {
  run("git", ["commit", "-m", "Update bundled submodule pointers"]);
} else {
  console.log("main: unchanged, nothing to commit");
}
if (shouldPush) run("git", ["push", "origin", "main"]);

if (!shouldPush) {
  console.log("Dry run complete. Re-run with --push to publish bundle and main.");
}
