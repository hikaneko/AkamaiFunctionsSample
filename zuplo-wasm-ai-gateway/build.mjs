#!/usr/bin/env node
// Workaround: componentize-js / wizer cannot handle spaces in paths.
// This script creates a symlink in /tmp (no spaces) and runs the build there.

import { execSync } from "child_process";
import { mkdirSync, symlinkSync, unlinkSync, existsSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const projectDir = resolve(dirname(fileURLToPath(import.meta.url)));
const tmpDir = "/tmp/zuplo-ai-chat-build";

// Clean up any previous symlink
if (existsSync(tmpDir)) {
  execSync(`rm -rf "${tmpDir}"`);
}

// Create symlink from tmp (no spaces) to actual project dir
symlinkSync(projectDir, tmpDir);

try {
  execSync(
    `node ${tmpDir}/node_modules/@fermyon/spin-sdk/bin/j2w.mjs -i ${tmpDir}/src/index.js -n spin3-http -d ${tmpDir}/node_modules/@fermyon/spin-sdk/bin/wit -o ${tmpDir}/spin.wasm`,
    { stdio: "inherit" }
  );
  console.log("Build succeeded: spin.wasm");
} finally {
  unlinkSync(tmpDir);
}
