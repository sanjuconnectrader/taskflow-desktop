const path = require("node:path");
const fs = require("node:fs");
module.exports = (root, pathname) => {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || decoded.includes("\\")) return null;
  const candidate = path.resolve(root, "." + decoded);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) return null;
  const file =
    fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()
      ? path.join(candidate, "index.html")
      : candidate;
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
};
