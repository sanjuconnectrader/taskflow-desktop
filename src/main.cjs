const {
  app,
  BrowserWindow,
  protocol,
  net,
  shell,
  Menu,
  ipcMain,
  safeStorage,
} = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
protocol.registerSchemesAsPrivileged([
  {
    scheme: "taskflow",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);
const webRoot = path.resolve(__dirname, "../web");
const assetPath = require("./paths.cjs");
let mainWindow;
const trusted = (event) =>
  event.senderFrame?.url?.startsWith("taskflow://app/");
const sessionPath = () => path.join(app.getPath("userData"), "session.enc");
app.whenReady().then(() => {
  protocol.handle("taskflow", (request) => {
    try {
      const url = new URL(request.url);
      if (url.host !== "app") return new Response("Forbidden", { status: 403 });
      const file = assetPath(webRoot, url.pathname);
      if (!file) return new Response("Not found", { status: 404 });
      return net.fetch(pathToFileURL(file).toString());
    } catch {
      return new Response("Bad request", { status: 400 });
    }
  });
  async function encryptedStorageAvailable() {
    if (
      process.platform === "linux" &&
      safeStorage.getSelectedStorageBackend() === "basic_text"
    )
      throw new Error("An encrypted Linux secret service is required");
    if (!(await safeStorage.isAsyncEncryptionAvailable()))
      throw new Error("OS credential encryption is unavailable");
  }
  ipcMain.handle("session:get", async (event) => {
    if (!trusted(event)) throw new Error("Untrusted caller");
    await encryptedStorageAvailable();
    if (!fs.existsSync(sessionPath())) return null;
    const value = await safeStorage.decryptStringAsync(
      fs.readFileSync(sessionPath()),
    );
    if (value.shouldReEncrypt)
      fs.writeFileSync(
        sessionPath(),
        await safeStorage.encryptStringAsync(value.result),
        { mode: 0o600 },
      );
    return value.result;
  });
  ipcMain.handle("session:set", async (event, value) => {
    if (!trusted(event)) throw new Error("Untrusted caller");
    if (value === null) {
      fs.rmSync(sessionPath(), { force: true });
      return;
    }
    if (typeof value !== "string" || value.length > 512)
      throw new Error("Invalid session");
    await encryptedStorageAvailable();
    fs.writeFileSync(
      sessionPath(),
      await safeStorage.encryptStringAsync(value),
      { mode: 0o600 },
    );
  });
  function createWindow() {
    let bounds = { width: 1440, height: 1000 };
    const state = path.join(app.getPath("userData"), "window.json");
    try {
      const stored = JSON.parse(fs.readFileSync(state, "utf8"));
      bounds = {
        width: Math.max(800, Math.min(stored.width || 1440, 3840)),
        height: Math.max(600, Math.min(stored.height || 1000, 2160)),
      };
    } catch {}
    mainWindow = new BrowserWindow({
      ...bounds,
      minWidth: 800,
      minHeight: 600,
      title: "TaskFlow",
      icon: path.join(__dirname, "../assets/icon.png"),
      backgroundColor: "#f8fafc",
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    });
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      try {
        const u = new URL(url);
        if (u.protocol === "https:") shell.openExternal(url);
      } catch {}
      return { action: "deny" };
    });
    mainWindow.webContents.on("will-navigate", (event, url) => {
      if (!url.startsWith("taskflow://app/")) event.preventDefault();
    });
    mainWindow.webContents.session.setPermissionRequestHandler(
      (_webContents, _permission, callback) => callback(false),
    );
    mainWindow.on("close", () => {
      fs.writeFileSync(state, JSON.stringify(mainWindow.getBounds()));
    });
    mainWindow.loadURL("taskflow://app/");
  }
  const template = [
    {
      label: "TaskFlow",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { role: "togglefullscreen" },
      ],
    },
  ];
  if (!app.isPackaged) template[2].submenu.push({ role: "toggleDevTools" });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
