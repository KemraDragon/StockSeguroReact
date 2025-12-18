function seedProductsIfNeeded(db) {
  const row = db.prepare("SELECT COUNT(*) as count FROM productos").get();
  const count = Number(row?.count ?? 0);
  if (count > 0) return;

  upsertCatalog(db, getCatalog());
  console.log(`✅ Seed productos: ${getCatalog().length} insertados`);
}

// ✅ CAMINO 1: “reset catálogo” SIN borrar filas (safe con FK)
// - Desactiva todos
// - Inserta/actualiza el catálogo nuevo (UPSERT)
// - Reactiva (active=1) los productos del catálogo nuevo
function replaceCatalogSoft(db) {
  const tx = db.transaction(() => {
    // 1) apagar todos
    db.prepare("UPDATE productos SET active = 0").run();

    // 2) upsert del catálogo nuevo (reactiva los que estén en el catálogo)
    upsertCatalog(db, getCatalog());
  });

  tx();
  console.log(`✅ Catálogo reemplazado (soft). Activos: ${getCatalog().length}`);
}

// ✅ UPSERT (si existe, actualiza; si no, inserta)
function upsertCatalog(db, products) {
  const stmt = db.prepare(`
    INSERT INTO productos
      (id, barcode, name, category, unitPrice, boxPrice, stock, minStock, image, active)
    VALUES
      (@id, @barcode, @name, @category, @unitPrice, @boxPrice, @stock, @minStock, @image, 1)
    ON CONFLICT(id) DO UPDATE SET
      barcode      = excluded.barcode,
      name         = excluded.name,
      category     = excluded.category,
      unitPrice    = excluded.unitPrice,
      boxPrice     = excluded.boxPrice,
      stock        = excluded.stock,
      minStock     = excluded.minStock,
      image        = excluded.image,
      active       = 1
  `);

  const tx = db.transaction(() => {
    for (const p of products) stmt.run(p);
  });

  tx();
}

// ✅ ACÁ PONES TU CATÁLOGO “USA / ENGLISH / USD”
// OJO: unitPrice/boxPrice siguen siendo enteros (centavos o dólares enteros, como tú decidas)
function getCatalog() {
  return [
    {
      id: "012000001111",          // usa IDs/UPCs reales si quieres
      barcode: "012000001111",
      name: "Heineken Lager 12oz Can",
      category: "Beers",
      unitPrice: 400,              // ejemplo: si estás usando “centavos” => $4.00
      boxPrice: 4800,              // 12-pack => $48.00
      stock: 72,
      minStock: 18,
      image: "🍺",
    },
    
    {
      id: "012345678901",
      barcode: "012345678901",
      name: "Tito's Handmade Vodka 750ml",
      category: "Spirits",
      unitPrice: 2899,
      boxPrice: 2899 * 6,
      stock: 24,
      minStock: 6,
      image: "🍸",
    },
    {
      id: "012345678902",
      barcode: "012345678902",
      name: "Jameson Irish Whiskey 750ml",
      category: "Spirits",
      unitPrice: 3299,
      boxPrice: 3299 * 6,
      stock: 18,
      minStock: 6,
      image: "🥃",
    },
    {
      id: "012345678903",
      barcode: "012345678903",
      name: "Jack Daniel's Old No. 7 750ml",
      category: "Spirits",
      unitPrice: 2799,
      boxPrice: 2799 * 6,
      stock: 20,
      minStock: 6,
      image: "🥃",
    },
    {
      id: "012345678904",
      barcode: "012345678904",
      name: "Bacardi Superior Rum 750ml",
      category: "Spirits",
      unitPrice: 1899,
      boxPrice: 1899 * 6,
      stock: 22,
      minStock: 6,
      image: "🥃",
    },
    {
      id: "012345678905",
      barcode: "012345678905",
      name: "Hennessy VS Cognac 750ml",
      category: "Spirits",
      unitPrice: 4999,
      boxPrice: 4999 * 6,
      stock: 10,
      minStock: 4,
      image: "🥃",
    },
    {
      id: "012345678906",
      barcode: "012345678906",
      name: "Patrón Silver Tequila 750ml",
      category: "Spirits",
      unitPrice: 5299,
      boxPrice: 5299 * 6,
      stock: 8,
      minStock: 4,
      image: "🍹",
    },

    // Wines
    {
      id: "012345679001",
      barcode: "012345679001",
      name: "Josh Cellars Cabernet Sauvignon 750ml",
      category: "Wine",
      unitPrice: 1699,
      boxPrice: 1699 * 12,
      stock: 30,
      minStock: 12,
      image: "🍷",
    },
    {
      id: "012345679002",
      barcode: "012345679002",
      name: "Kendall-Jackson Chardonnay 750ml",
      category: "Wine",
      unitPrice: 1599,
      boxPrice: 1599 * 12,
      stock: 26,
      minStock: 12,
      image: "🍷",
    },
    {
      id: "012345679003",
      barcode: "012345679003",
      name: "Apothic Red Blend 750ml",
      category: "Wine",
      unitPrice: 1399,
      boxPrice: 1399 * 12,
      stock: 28,
      minStock: 12,
      image: "🍷",
    },

    // Beer
    {
      id: "012345679101",
      barcode: "012345679101",
      name: "Heineken Lager 12oz (6-pack)",
      category: "Beer",
      unitPrice: 1199,
      boxPrice: 1199 * 4, // “case” ficticio: 4x six-pack
      stock: 40,
      minStock: 12,
      image: "🍺",
    },
    {
      id: "012345679102",
      barcode: "012345679102",
      name: "Corona Extra 12oz (6-pack)",
      category: "Beer",
      unitPrice: 1099,
      boxPrice: 1099 * 4,
      stock: 36,
      minStock: 12,
      image: "🍺",
    },
    {
      id: "012345679103",
      barcode: "012345679103",
      name: "Budweiser 12oz (6-pack)",
      category: "Beer",
      unitPrice: 999,
      boxPrice: 999 * 4,
      stock: 44,
      minStock: 12,
      image: "🍺",
    },

    // Non-alcoholic / mixers (por si quieres venderlos)
    {
      id: "012345679201",
      barcode: "012345679201",
      name: "Red Bull Energy Drink 8.4oz",
      category: "Mixers",
      unitPrice: 299,
      boxPrice: 299 * 24,
      stock: 120,
      minStock: 24,
      image: "⚡",
    },
    {
      id: "012345679202",
      barcode: "012345679202",
      name: "Coca-Cola 12oz",
      category: "Mixers",
      unitPrice: 199,
      boxPrice: 199 * 24,
      stock: 96,
      minStock: 24,
      image: "🥤",
    },

    // Liqueurs / Cream
    {
      id: "012345679301",
      barcode: "012345679301",
      name: "Baileys Irish Cream 750ml",
      category: "Liqueurs",
      unitPrice: 3199,
      boxPrice: 3199 * 6,
      stock: 12,
      minStock: 4,
      image: "🥛",
    },
  ];
}

module.exports = { seedProductsIfNeeded, replaceCatalogSoft };
