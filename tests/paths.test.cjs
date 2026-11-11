const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const resolve = require("../src/paths.cjs");
test("asset handler resolves static routes and rejects traversal", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "taskflow-"));
  try {
    fs.writeFileSync(path.join(dir, "index.html"), "ok");
    assert.equal(resolve(dir, "/"), path.join(dir, "index.html"));
    for (const p of [
      "/../private",
      "/%2e%2e/private",
      "/x%00",
      "/x\\y",
      "/missing",
    ])
      assert.equal(resolve(dir, p), null);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
