const { spawn } = require("node:child_process");
// Electron itself performs startup; a bounded run fails on crash or missing assets.
const fs = require("node:fs");
if (!fs.existsSync("web/index.html"))
  throw new Error("Copy frontend assets before smoke testing.");
const env = { ...process.env, TASKFLOW_SMOKE: "1" };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(require("electron"), ["."], { env, stdio: "inherit" });
let finished = false;
child.on("exit", (code) => {
  if (!finished) process.exit(code || 1);
});
setTimeout(() => {
  finished = true;
  child.kill();
  console.log("Electron stayed running for 8 seconds.");
}, 8000);
