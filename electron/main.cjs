const { seedProductsIfNeeded } = require("./seedProducts.cjs");
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const bcrypt = require("bcryptjs");
const { openDb } = require("./db.cjs");

let db;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
    },
  });

  // DEV (Vite)
  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // PROD (Vite build)
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function seedDemoUserIfNeeded() {
  // si no hay usuarios, creamos uno demo para poder probar login hoy mismo
  const countRow = db.prepare("SELECT COUNT(*) as count FROM trabajadores").get();
  const count = Number(countRow?.count ?? 0);

  if (count > 0) return;

  const rutDemo = "12.345.678-9";
  const pinDemo = "1234";
  const pinHash = bcrypt.hashSync(pinDemo, 10);

  db.prepare(
    `INSERT INTO trabajadores (rut, nombre, pin_hash, activo)
     VALUES (?, ?, ?, 1)`
  ).run(rutDemo, "Kevin Demo", pinHash);

  console.log("✅ Usuario demo creado:");
  console.log(`   RUT: ${rutDemo}`);
  console.log(`   PIN: ${pinDemo}`);
}

app.whenReady().then(() => {
  db = openDb(app);
  seedProductsIfNeeded(db);

  // ✅ Seed demo (solo si DB está vacía)
  seedDemoUserIfNeeded();
  
  ipcMain.handle("sales:complete", (_e, payload) => {
  try {
    const trabajadorId = Number(payload?.trabajadorId);
    const metodoPago = String(payload?.metodoPago ?? "").trim();
    const montoRecibido =
      payload?.montoRecibido === null || payload?.montoRecibido === undefined
        ? null
        : Number(payload.montoRecibido);

    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (!trabajadorId) return { ok: false, error: "Trabajador inválido." };
    if (!metodoPago) return { ok: false, error: "Método de pago inválido." };
    if (items.length === 0) return { ok: false, error: "Carrito vacío." };

    // Validar stock disponible y calcular total
    let total = 0;

    for (const it of items) {
      const productId = String(it?.productId ?? "");
      const qty = Number(it?.quantity ?? 0);

      if (!productId || qty <= 0) {
        return { ok: false, error: "Ítem inválido en el carrito." };
      }

      const row = db
        .prepare(
          "SELECT id, unitPrice, stock, active FROM productos WHERE id = ? AND active = 1"
        )
        .get(productId);

      if (!row) return { ok: false, error: `Producto no existe: ${productId}` };
      if (row.stock < qty)
        return {
          ok: false,
          error: `Stock insuficiente para ${productId} (disponible ${row.stock}).`,
        };

      total += row.unitPrice * qty;
    }

    const createdAt = new Date().toISOString();

    const tx = db.transaction(() => {
      const saleInfo = db
        .prepare(
          `INSERT INTO ventas (trabajador_id, total, metodo_pago, monto_recibido, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run(trabajadorId, total, metodoPago, montoRecibido, createdAt);

      const ventaId = saleInfo.lastInsertRowid;

      const insertDetail = db.prepare(
        `INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`
      );

      const updateStock = db.prepare(
        `UPDATE productos SET stock = stock - ? WHERE id = ?`
      );

      for (const it of items) {
        const productId = String(it.productId);
        const qty = Number(it.quantity);

        const productRow = db
          .prepare("SELECT unitPrice FROM productos WHERE id = ?")
          .get(productId);

        const unitPrice = Number(productRow.unitPrice);
        const subtotal = unitPrice * qty;

        insertDetail.run(ventaId, productId, qty, unitPrice, subtotal);
        updateStock.run(qty, productId);
      }

      return Number(ventaId);
    });

    const ventaId = tx();

    return { ok: true, ventaId, total };
  } catch (e) {
    console.error("Error completando venta:", e);
    return { ok: false, error: "Error interno al completar la venta." };
  }
});

  ipcMain.handle("products:list", () => {
  const rows = db.prepare(`
    SELECT id, barcode, name, category, unitPrice, boxPrice, stock, minStock, image
    FROM productos
    WHERE active = 1
    ORDER BY category, name
  `).all();

  return { ok: true, products: rows };
  });


  ipcMain.handle("auth:login", (_e, payload) => {
    const rut = String(payload?.rut ?? "").trim();
    const pin = String(payload?.pin ?? "").trim();

    if (!rut) return { ok: false, error: "Debes ingresar el RUT." };
    if (!pin) return { ok: false, error: "Debes ingresar el PIN." };

    const row = db
      .prepare(
        "SELECT id, rut, nombre, pin_hash, activo FROM trabajadores WHERE rut = ?"
      )
      .get(rut);

    if (!row) return { ok: false, error: "RUT no registrado." };
    if (row.activo !== 1) return { ok: false, error: "Usuario desactivado." };

    const ok = bcrypt.compareSync(pin, row.pin_hash);
    if (!ok) return { ok: false, error: "PIN incorrecto." };

    return {
      ok: true,
      user: { id: row.id, rut: row.rut, nombre: row.nombre },
    };
  });

  createWindow();

  // (Mac) re-abrir ventana si se cierra y la app sigue viva
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Cerrar app cuando no queden ventanas (excepto en macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
