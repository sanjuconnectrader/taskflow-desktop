const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "taskflow",
  Object.freeze({
    platform: process.platform,
    getSession: () => ipcRenderer.invoke("session:get"),
    setSession: (value) => ipcRenderer.invoke("session:set", value),
  }),
);
