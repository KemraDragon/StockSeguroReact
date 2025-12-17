const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (rut, pin) => ipcRenderer.invoke("auth:login", { rut, pin }),
  getProducts: () => ipcRenderer.invoke("products:list"),
  completeSale: (payload) => ipcRenderer.invoke("sales:complete", payload),
});
