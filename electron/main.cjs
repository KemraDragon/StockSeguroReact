const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const bcrypt = require("bcryptjs");
const { openDb } = require("./db.cjs");

// ✅ IMPORTANTE: traer replaceCatalogSoft desde el seed
const { replaceCatalogSoft } = require("./seedProducts.cjs");

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

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function seedDemoUserIfNeeded() {
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

  // ✅ Reemplazo seguro del catálogo (USA / English / USD)
  // (soft-reset: apaga todo, upsert, reactiva el catálogo)
  replaceCatalogSoft(db);

  // Demo user (solo si no hay usuarios)
  seedDemoUserIfNeeded();

  // =======================
  // AUTH
  // =======================
 // =======================
// AUTH (EMAIL + PIN)
// =======================
ipcMain.handle("auth:login", (_e, payload) => {
  try {
    const email = String(payload?.email ?? "").trim().toLowerCase();
    const password = String(payload?.password ?? "").trim();

    if (!email) return { ok: false, error: "Please enter your email." };
    if (!password) return { ok: false, error: "Please enter your password." };

    const row = db
      .prepare(
        `SELECT id, rut, nombre, email, pin_hash, activo
         FROM trabajadores
         WHERE lower(email) = ?
         LIMIT 1`
      )
      .get(email);

    if (!row) return { ok: false, error: "Invalid credentials." };
    if (row.activo !== 1) return { ok: false, error: "User is inactive." };

    const ok = bcrypt.compareSync(password, row.pin_hash);
    if (!ok) return { ok: false, error: "Invalid credentials." };

    return {
      ok: true,
      user: {
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        rut: row.rut, // compatibilidad legacy
      },
    };
  } catch (e) {
    console.error("auth:login error", e);
    return { ok: false, error: "Internal error." };
  }
});

  // =======================
  // PRODUCTS: LIST
  // =======================
  ipcMain.handle("products:list", () => {
    const rows = db
      .prepare(
        `SELECT id, barcode, name, category, unitPrice, boxPrice, stock, minStock, image
         FROM productos
         WHERE active = 1
         ORDER BY category, name`
      )
      .all();

    return { ok: true, products: rows };
  });

  // =======================
  // PRODUCTS: CREATE
  // =======================
  ipcMain.handle("products:create", (_e, payload) => {
    try {
      const p = payload ?? {};

      const id = String(p.id ?? "").trim();
      const barcode = String(p.barcode ?? "").trim();
      const name = String(p.name ?? "").trim();
      const category = String(p.category ?? "").trim();

      const unitPrice = Number(p.unitPrice ?? 0);
      const boxPrice = Number(p.boxPrice ?? 0);
      const stock = Number(p.stock ?? 0);
      const minStock = Number(p.minStock ?? 0);
      const image = String(p.image ?? "📦");

      if (!id) return { ok: false, error: "Falta ID." };
      if (!barcode) return { ok: false, error: "Falta código de barras." };
      if (!name) return { ok: false, error: "Falta nombre." };
      if (!category) return { ok: false, error: "Falta categoría." };

      if (!Number.isFinite(unitPrice) || unitPrice <= 0)
        return { ok: false, error: "Precio unitario inválido." };
      if (!Number.isFinite(boxPrice) || boxPrice < 0)
        return { ok: false, error: "Precio por caja inválido." };
      if (!Number.isFinite(stock) || stock < 0)
        return { ok: false, error: "Stock inválido." };
      if (!Number.isFinite(minStock) || minStock < 0)
        return { ok: false, error: "Stock mínimo inválido." };

      const exists = db
        .prepare("SELECT id FROM productos WHERE id = ? OR barcode = ? LIMIT 1")
        .get(id, barcode);

      if (exists)
        return {
          ok: false,
          error: "Ya existe un producto con ese ID o código de barras.",
        };

      db.prepare(
        `INSERT INTO productos
          (id, barcode, name, category, unitPrice, boxPrice, stock, minStock, image, active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
      ).run(id, barcode, name, category, unitPrice, boxPrice, stock, minStock, image);

      return { ok: true };
    } catch (e) {
      console.error("products:create error", e);
      return { ok: false, error: "Error creando producto." };
    }
  });

  // =======================
  // PRODUCTS: UPDATE
  // =======================
  ipcMain.handle("products:update", (_e, payload) => {
    try {
      const p = payload ?? {};

      const id = String(p.id ?? "").trim();
      if (!id) return { ok: false, error: "Falta ID." };

      const barcode = String(p.barcode ?? "").trim();
      const name = String(p.name ?? "").trim();
      const category = String(p.category ?? "").trim();

      const unitPrice = Number(p.unitPrice ?? 0);
      const boxPrice = Number(p.boxPrice ?? 0);
      const stock = Number(p.stock ?? 0);
      const minStock = Number(p.minStock ?? 0);
      const image = String(p.image ?? "📦");

      const clash = db
        .prepare("SELECT id FROM productos WHERE barcode = ? AND id <> ? LIMIT 1")
        .get(barcode, id);

      if (clash) return { ok: false, error: "Ese código de barras ya lo usa otro producto." };

      const info = db
        .prepare(
          `UPDATE productos SET
            barcode = ?,
            name = ?,
            category = ?,
            unitPrice = ?,
            boxPrice = ?,
            stock = ?,
            minStock = ?,
            image = ?,
            active = 1
          WHERE id = ?`
        )
        .run(barcode, name, category, unitPrice, boxPrice, stock, minStock, image, id);

      if (info.changes === 0) return { ok: false, error: "Producto no encontrado." };
      return { ok: true };
    } catch (e) {
      console.error("products:update error", e);
      return { ok: false, error: "Error actualizando producto." };
    }
  });

  // =======================
  // PRODUCTS: DELETE (soft)
  // =======================
  ipcMain.handle("products:delete", (_e, payload) => {
    try {
      const productId = String(payload?.productId ?? "").trim();
      if (!productId) return { ok: false, error: "ID inválido." };

      const info = db.prepare("UPDATE productos SET active = 0 WHERE id = ?").run(productId);
      if (info.changes === 0) return { ok: false, error: "Producto no encontrado." };

      return { ok: true };
    } catch (e) {
      console.error("products:delete error", e);
      return { ok: false, error: "Error interno al eliminar." };
    }
  });

  // =======================
  // SALES: COMPLETE
  // =======================
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
        if (row.stock < qty) {
          return {
            ok: false,
            error: `Stock insuficiente para ${productId} (disponible ${row.stock}).`,
          };
        }

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

        const updateStock = db.prepare(`UPDATE productos SET stock = stock - ? WHERE id = ?`);

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

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
