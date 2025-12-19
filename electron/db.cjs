const path = require("path");
const Database = require("better-sqlite3");

// ✅ IMPORTAR seeds
const { seedProductsIfNeeded, replaceCatalogSoft } = require("./seedProducts.cjs");

function openDb(app) {
  const dbPath = path.join(app.getPath("userData"), "stockseguro.db");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");

  // ✅ habilitar foreign keys
  db.pragma("foreign_keys = ON");

  // -----------------------------
  // TABLAS BASE
  // -----------------------------
  db.exec(`
  CREATE TABLE IF NOT EXISTS trabajadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rut TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    pin_hash TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1
  );
`);

  // ✅ Migración: asegurar columna email en trabajadores (para DB ya existentes)
  try {
    const cols = db.prepare("PRAGMA table_info(trabajadores)").all();
    const hasEmail = cols.some((c) => c.name === "email");
    if (!hasEmail) {
      db.exec("ALTER TABLE trabajadores ADD COLUMN email TEXT");
      // índice unique para email (case-insensitive)
      db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_trabajadores_email_lower ON trabajadores(lower(email))");
    }
  } catch (e) {
    console.warn("⚠️ No se pudo asegurar columna email en trabajadores:", e);
  }


  db.exec(`
    CREATE TABLE IF NOT EXISTS productos (
      id TEXT PRIMARY KEY,
      barcode TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unitPrice INTEGER NOT NULL,
      boxPrice INTEGER NOT NULL,
      stock INTEGER NOT NULL,
      minStock INTEGER NOT NULL,
      image TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_productos_barcode ON productos(barcode);
    CREATE INDEX IF NOT EXISTS idx_productos_name ON productos(name);
    CREATE INDEX IF NOT EXISTS idx_productos_category ON productos(category);
  `);

  // -----------------------------
  // TABLAS DE VENTAS
  // -----------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trabajador_id INTEGER NOT NULL,
      total INTEGER NOT NULL,
      metodo_pago TEXT NOT NULL,
      monto_recibido INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY(trabajador_id) REFERENCES trabajadores(id)
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS venta_detalle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      FOREIGN KEY(venta_id) REFERENCES ventas(id),
      FOREIGN KEY(producto_id) REFERENCES productos(id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas(created_at);
  `);

  // -----------------------------
  // ✅ STOCK MOVEMENTS (ADD / SUBTRACT LOG)
  // -----------------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id TEXT NOT NULL,
      trabajador_id INTEGER NOT NULL,
      operacion TEXT NOT NULL CHECK (operacion IN ('add', 'subtract')),
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      motivo TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (producto_id) REFERENCES productos(id),
      FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id)
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_movimientos_producto
    ON stock_movimientos (producto_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_movimientos_trabajador
    ON stock_movimientos (trabajador_id);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_stock_movimientos_created_at
    ON stock_movimientos (created_at);
  `);

  // -----------------------------
  // ✅ SEED / REEMPLAZO DE CATÁLOGO
  // -----------------------------
  if (process.env.RESET_CATALOG === "1") {
    replaceCatalogSoft(db);
  } else {
    seedProductsIfNeeded(db);
  }

  return db;
}

module.exports = { openDb };
