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
const api = process.env.NEXT_PUBLIC_API_URL || "https://taskflow-backend-ouuj.onrender.com";
if (!/^https:\/\//.test(api) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(api)) throw new Error("Invalid API origin.");
fs.writeFileSync(path.join(root,"web","update-config.json"), JSON.stringify({apiOrigin:new URL(api).origin}));
console.log("Shared frontend assets copied.");
