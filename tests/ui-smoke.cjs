const { _electron: electron } = require("@playwright/test");
(async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ args: ["."], env });
  try {
    const page = await app.firstWindow();
    await page.getByRole("heading", { name: "Welcome back" }).waitFor();
    const bridge = await page.evaluate(() => ({
      node: typeof require,
      platform: window.taskflow?.platform,
      keys: Object.keys(window.taskflow || {}),
    }));
    if (
      bridge.node !== "undefined" ||
      bridge.keys.join(",") !== "platform,getSession,setSession"
    )
      throw new Error("Renderer isolation check failed");
    await page.evaluate(async () => {
      await window.taskflow.setSession("taskflow-smoke-token");
      if ((await window.taskflow.getSession()) !== "taskflow-smoke-token")
        throw Error("Secure storage round trip failed");
      await window.taskflow.setSession(null);
    });
    console.log(
      "Electron rendered local UI; Node is isolated; secure session storage round trip passed.",
    );
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
