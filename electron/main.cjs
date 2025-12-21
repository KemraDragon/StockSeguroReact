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
  const emailDemo = "kevin@demo.com";
  const pinDemo = "1234";
  const pinHash = bcrypt.hashSync(pinDemo, 10);

  db.prepare(
    `INSERT INTO trabajadores (rut, nombre, email, pin_hash, activo)
   VALUES (?, ?, ?, ?, 1)`
  ).run(rutDemo, "Kevin Demo", emailDemo, pinHash);

  console.log("✅ Usuario demo creado:");
  console.log(`   EMAIL: ${emailDemo}`);
  console.log(`   PIN: ${pinDemo}`);
  console.log(`   RUT: ${rutDemo}`);
}

app.whenReady().then(() => {
  db = openDb(app);

  // ✅ Solo resetear catálogo si tú lo pides explícitamente
  if (process.env.RESET_CATALOG === "1") {
    replaceCatalogSoft(db);
  }

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

      // 1) Validación + cálculo total (usando DB como fuente de verdad)
      let total = 0;

      for (const it of items) {
        const productId = String(it?.productId ?? "").trim();
        const qty = Number(it?.quantity ?? 0);

        if (!productId || !Number.isFinite(qty) || qty <= 0) {
          return { ok: false, error: "Ítem inválido en el carrito." };
        }

        const row = db
          .prepare(
            "SELECT id, unitPrice, stock, active FROM productos WHERE id = ? AND active = 1"
          )
          .get(productId);

        if (!row) return { ok: false, error: `Producto no existe: ${productId}` };
        if (Number(row.stock) < qty) {
          return {
            ok: false,
            error: `Stock insuficiente para ${productId} (disponible ${row.stock}).`,
          };
        }

        total += Number(row.unitPrice) * qty;
      }

      const createdAt = new Date().toISOString();

      // 2) Statements
      const insertVenta = db.prepare(
        `INSERT INTO ventas (trabajador_id, total, metodo_pago, monto_recibido, created_at)
         VALUES (?, ?, ?, ?, ?)`
      );

      const insertDetail = db.prepare(
        `INSERT INTO venta_detalle (venta_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES (?, ?, ?, ?, ?)`
      );

      const updateStock = db.prepare(
        `UPDATE productos SET stock = stock - ? WHERE id = ? AND active = 1`
      );

      // Log stock_movimientos (sale)
      const insertStockMove = db.prepare(
        `INSERT INTO stock_movimientos (producto_id, trabajador_id, operacion, cantidad, motivo, created_at)
         VALUES (?, ?, 'subtract', ?, ?, ?)`
      );

      // 3) Transacción atómica
      const tx = db.transaction(() => {
        const info = insertVenta.run(trabajadorId, total, metodoPago, montoRecibido, createdAt);
        const ventaId = Number(info.lastInsertRowid);

        for (const it of items) {
          const productId = String(it.productId).trim();
          const qty = Number(it.quantity);

          const productRow = db
            .prepare("SELECT unitPrice, stock FROM productos WHERE id = ? AND active = 1")
            .get(productId);

          if (!productRow) throw new Error(`Producto no existe: ${productId}`);

          const unitPrice = Number(productRow.unitPrice);
          const subtotal = unitPrice * qty;

          // detalle
          insertDetail.run(ventaId, productId, qty, unitPrice, subtotal);

          // stock (si por alguna razón cambió entre validación y tx, esto protege)
          const stockInfo = updateStock.run(qty, productId);
          if (stockInfo.changes === 0) {
            throw new Error(`No se pudo descontar stock para ${productId}.`);
          }

          // movimiento stock
          insertStockMove.run(productId, trabajadorId, qty, `sale:${ventaId}`, createdAt);
        }

        return ventaId;
      });

      const ventaId = tx();
      return { ok: true, ventaId, total };
    } catch (e) {
      console.error("Error completando venta:", e);
      return { ok: false, error: "Error interno al completar la venta." };
    }
  });

  // =======================
  // STOCK: ADJUST + LOG
  // =======================
  ipcMain.handle("stock:adjust", (_e, payload) => {
    try {
      const workerId = Number(payload?.workerId ?? payload?.trabajadorId);
      const productId = String(payload?.productId ?? "").trim();
      const operation = String(payload?.operation ?? "").trim(); // 'add' | 'subtract'
      const quantity = Number(payload?.quantity ?? 0);
      const reason = String(payload?.reason ?? payload?.motivo ?? "").trim();

      if (!workerId) return { ok: false, error: "Invalid worker." };
      if (!productId) return { ok: false, error: "Invalid product." };
      if (!["add", "subtract"].includes(operation)) return { ok: false, error: "Invalid operation." };
      if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, error: "Invalid quantity." };

      // Reason required only for subtract
      if (operation === "subtract" && !reason) {
        return { ok: false, error: "Please enter a short reason for the stock deduction." };
      }

      const product = db
        .prepare("SELECT id, stock, active FROM productos WHERE id = ? AND active = 1")
        .get(productId);

      if (!product) return { ok: false, error: "Product not found." };

      if (operation === "subtract" && Number(product.stock) < quantity) {
        return { ok: false, error: `Insufficient stock (available ${product.stock}).` };
      }

      const createdAt = new Date().toISOString();

      const tx = db.transaction(() => {
        if (operation === "add") {
          db.prepare("UPDATE productos SET stock = stock + ? WHERE id = ?").run(quantity, productId);
        } else {
          db.prepare("UPDATE productos SET stock = stock - ? WHERE id = ?").run(quantity, productId);
        }

        db.prepare(
          `INSERT INTO stock_movimientos (producto_id, trabajador_id, operacion, cantidad, motivo, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
        ).run(
          productId,
          workerId,
          operation,
          quantity,
          operation === "subtract" ? reason : null,
          createdAt
        );

        const updated = db.prepare("SELECT stock FROM productos WHERE id = ?").get(productId);
        return Number(updated.stock);
      });

      const newStock = tx();
      return { ok: true, newStock };
    } catch (e) {
      console.error("stock:adjust error", e);
      return { ok: false, error: "Internal error adjusting stock." };
    }
  });

  // =======================
// HISTORY: SALES (paged)
// =======================
ipcMain.handle("history:sales", (_e, payload) => {
  try {
    const pageSize = Math.max(1, Math.min(50, Number(payload?.pageSize ?? 10)));
    const page = Math.max(1, Number(payload?.page ?? 1));
    const offset = (page - 1) * pageSize;

    const totalRow = db.prepare("SELECT COUNT(*) AS count FROM ventas").get();
    const total = Number(totalRow?.count ?? 0);

    const sales = db
      .prepare(
        `SELECT
           v.id,
           v.total,
           v.metodo_pago,
           v.monto_recibido,
           v.created_at,
           t.nombre AS cashier_name,
           t.email  AS cashier_email
         FROM ventas v
         JOIN trabajadores t ON t.id = v.trabajador_id
         ORDER BY v.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(pageSize, offset);

    const saleIds = sales.map((s) => s.id);
    let detailsBySaleId = new Map();

    if (saleIds.length > 0) {
      const placeholders = saleIds.map(() => "?").join(",");
      const details = db
        .prepare(
          `SELECT
             d.venta_id,
             d.producto_id,
             d.cantidad,
             d.precio_unitario,
             d.subtotal,
             p.name AS product_name
           FROM venta_detalle d
           JOIN productos p ON p.id = d.producto_id
           WHERE d.venta_id IN (${placeholders})
           ORDER BY d.id ASC`
        )
        .all(...saleIds);

      detailsBySaleId = details.reduce((map, row) => {
        const key = row.venta_id;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({
          productId: row.producto_id,
          name: row.product_name,
          quantity: row.cantidad,
          unitPrice: row.precio_unitario,
          subtotal: row.subtotal,
        });
        return map;
      }, new Map());
    }

    const rows = sales.map((s) => ({
      id: Number(s.id),
      total: Number(s.total),
      paymentMethod: String(s.metodo_pago),
      receivedAmount: s.monto_recibido === null ? null : Number(s.monto_recibido),
      createdAt: String(s.created_at),
      cashier: s.cashier_name ?? "Unknown",
      cashierEmail: s.cashier_email ?? null,
      items: detailsBySaleId.get(s.id) ?? [],
    }));

    return {
      ok: true,
      page,
      pageSize,
      total,
      rows,
    };
  } catch (e) {
    console.error("history:sales error", e);
    return { ok: false, error: "Error loading sales history." };
  }
});

// =======================
// HISTORY: STOCK MOVEMENTS (paged)
// =======================
ipcMain.handle("history:stock", (_e, payload) => {
  try {
    const pageSize = Math.max(1, Math.min(50, Number(payload?.pageSize ?? 10)));
    const page = Math.max(1, Number(payload?.page ?? 1));
    const offset = (page - 1) * pageSize;

    const totalRow = db.prepare("SELECT COUNT(*) AS count FROM stock_movimientos").get();
    const total = Number(totalRow?.count ?? 0);

    const rows = db
      .prepare(
        `SELECT
           sm.id,
           sm.producto_id,
           p.name AS product_name,
           sm.trabajador_id,
           t.nombre AS worker_name,
           t.email  AS worker_email,
           sm.operacion,
           sm.cantidad,
           sm.motivo,
           sm.created_at
         FROM stock_movimientos sm
         JOIN productos p ON p.id = sm.producto_id
         JOIN trabajadores t ON t.id = sm.trabajador_id
         ORDER BY sm.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(pageSize, offset)
      .map((r) => ({
        id: Number(r.id),
        productId: String(r.producto_id),
        product: r.product_name ?? "Unknown",
        workerId: Number(r.trabajador_id),
        worker: r.worker_name ?? "Unknown",
        workerEmail: r.worker_email ?? null,
        operation: String(r.operacion), // add | subtract
        quantity: Number(r.cantidad),
        reason: r.motivo ?? null,
        createdAt: String(r.created_at),
      }));

    return { ok: true, page, pageSize, total, rows };
  } catch (e) {
    console.error("history:stock error", e);
    return { ok: false, error: "Error loading stock history." };
  }
});

// =======================
// HISTORY: MOVEMENTS (combined view, paged)
// - Unifica ventas + stock_movimientos
// =======================
ipcMain.handle("history:movements", (_e, payload) => {
  try {
    const pageSize = Math.max(1, Math.min(50, Number(payload?.pageSize ?? 10)));
    const page = Math.max(1, Number(payload?.page ?? 1));
    const offset = (page - 1) * pageSize;

    // total = ventas + stock_movimientos
    const totalSales = Number(db.prepare("SELECT COUNT(*) AS c FROM ventas").get()?.c ?? 0);
    const totalStock = Number(db.prepare("SELECT COUNT(*) AS c FROM stock_movimientos").get()?.c ?? 0);
    const total = totalSales + totalStock;

    // Sacamos ambos sets “sobre-muestreados” y luego mergeamos por created_at desc
    const sales = db
      .prepare(
        `SELECT v.id, v.created_at, t.nombre AS user_name, 'sale' AS kind, v.total AS total
         FROM ventas v
         JOIN trabajadores t ON t.id = v.trabajador_id
         ORDER BY v.created_at DESC
         LIMIT ? OFFSET 0`
      )
      .all(pageSize * 3);

    const stock = db
      .prepare(
        `SELECT sm.id, sm.created_at, t.nombre AS user_name, 'stock' AS kind,
                sm.operacion AS operacion, sm.cantidad AS cantidad, p.name AS product_name, sm.motivo AS motivo
         FROM stock_movimientos sm
         JOIN trabajadores t ON t.id = sm.trabajador_id
         JOIN productos p ON p.id = sm.producto_id
         ORDER BY sm.created_at DESC
         LIMIT ? OFFSET 0`
      )
      .all(pageSize * 3);

    const merged = [...sales, ...stock]
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(offset, offset + pageSize)
      .map((r) => {
        if (r.kind === "sale") {
          return {
            id: `SALE-${r.id}`,
            createdAt: String(r.created_at),
            user: r.user_name ?? "Unknown",
            action: "Completed sale",
            details: `Sale completed. Total: ${r.total}`,
            type: "success",
          };
        }

        const op = String(r.operacion);
        const qty = Number(r.cantidad);
        const prod = r.product_name ?? "Unknown";
        const reason = r.motivo ? ` (${r.motivo})` : "";

        return {
          id: `STK-${r.id}`,
          createdAt: String(r.created_at),
          user: r.user_name ?? "Unknown",
          action: op === "add" ? "Stock added" : "Stock deducted",
          details: `${op === "add" ? "+" : "-"}${qty} ${prod}${reason}`,
          type: op === "add" ? "success" : "warning",
        };
      });

    return { ok: true, page, pageSize, total, rows: merged };
  } catch (e) {
    console.error("history:movements error", e);
    return { ok: false, error: "Error loading movements history." };
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

