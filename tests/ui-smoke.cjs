const { _electron: electron } = require("@playwright/test");
(async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const app = await electron.launch({ args: ["."], env });
  try {
    const page = await app.firstWindow();
    await page.getByRole("heading", { name: "Welcome back" }).waitFor();
    for (const width of [320, 360, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 850 });
      if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)))
        throw Error(`Login overflows at ${width}px`);
    }
    const password = page.locator('input[name="password"]');
    await password.fill('visibility-check');
    await page.getByRole('button', {name:'Show password', exact:true}).click();
    if(await password.getAttribute('type') !== 'text') throw Error('Password reveal failed');
    await page.getByRole('button', {name:'Hide password', exact:true}).click();
    if(await password.getAttribute('type') !== 'password') throw Error('Password hiding failed');
    const bridge = await page.evaluate(() => ({
      node: typeof require,
      platform: window.taskflow?.platform,
      keys: Object.keys(window.taskflow || {}),
    }));
    if (
      bridge.node !== "undefined" ||
      bridge.keys.sort().join(",") !== "getSession,getVersion,onUpdateStatus,platform,setSession" ||
      !["win32", "linux", "darwin"].includes(bridge.platform)
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
