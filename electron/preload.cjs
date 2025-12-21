const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  login: (email, password) => ipcRenderer.invoke("auth:login", { email, password }),
  getProducts: () => ipcRenderer.invoke("products:list"),
  completeSale: (payload) => ipcRenderer.invoke("sales:complete", payload),

  createProduct: (payload) => ipcRenderer.invoke("products:create", payload),
  updateProduct: (payload) => ipcRenderer.invoke("products:update", payload),
  deleteProduct: (productId) => ipcRenderer.invoke("products:delete", { productId }),

  adjustStock: (payload) => ipcRenderer.invoke("stock:adjust", payload),
  getSalesHistory: (params) => ipcRenderer.invoke("history:sales", params),
  getStockHistory: (params) => ipcRenderer.invoke("history:stock", params),
  getMovementsHistory: (params) => ipcRenderer.invoke("history:movements", params),

});
