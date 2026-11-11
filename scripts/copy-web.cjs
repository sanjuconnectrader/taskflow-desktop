const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = path.resolve(
  process.env.FRONTEND_OUT || path.join(root, "../frontend/out"),
);
if (!fs.existsSync(path.join(source, "index.html")))
  throw new Error(
    "Build frontend first, or set FRONTEND_OUT to a built export.",
  );
fs.cpSync(source, path.join(root, "web"), { recursive: true });
console.log("Shared frontend assets copied.");
