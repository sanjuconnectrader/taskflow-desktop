const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "taskflow",
  Object.freeze({
    platform: process.platform,
    getVersion: () => ipcRenderer.invoke('app:version'),
    getSession: () => ipcRenderer.invoke("session:get"),
    setSession: (value) => ipcRenderer.invoke("session:set", value),
    onUpdateStatus: (callback) => {
      const listener = (_event, value) => callback(value);
      ipcRenderer.on('update:status', listener);
      return () => ipcRenderer.removeListener('update:status', listener);
    },
  }),
);
