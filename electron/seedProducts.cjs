function seedProductsIfNeeded(db) {
  const row = db.prepare("SELECT COUNT(*) as count FROM productos").get();
  const count = Number(row?.count ?? 0);
  if (count > 0) return;

  const products = [
    {
      id: "7702116011239",
      barcode: "7702116011239",
      name: "Aguardiente Antioqueño 750ml",
      category: "Licores",
      unitPrice: 28000,
      boxPrice: 280000,
      stock: 45,
      minStock: 10,
      image: "🍶",
    },
    {
      id: "7702259001234",
      barcode: "7702259001234",
      name: "Cerveza Poker Lata 330ml",
      category: "Cervezas",
      unitPrice: 2500,
      boxPrice: 60000,
      stock: 120,
      minStock: 30,
      image: "🍺",
    },
    {
      id: "7702259005678",
      barcode: "7702259005678",
      name: "Cerveza Águila Lata 330ml",
      category: "Cervezas",
      unitPrice: 2500,
      boxPrice: 60000,
      stock: 150,
      minStock: 40,
      image: "🍺",
    },
    {
      id: "7702259009012",
      barcode: "7702259009012",
      name: "Club Colombia Roja 330ml",
      category: "Cervezas",
      unitPrice: 3200,
      boxPrice: 76800,
      stock: 80,
      minStock: 20,
      image: "🍺",
    },
    {
      id: "7702116012345",
      barcode: "7702116012345",
      name: "Ron Medellín Añejo 750ml",
      category: "Licores",
      unitPrice: 35000,
      boxPrice: 350000,
      stock: 30,
      minStock: 8,
      image: "🥃",
    },
    {
      id: "7702116013456",
      barcode: "7702116013456",
      name: "Tequila José Cuervo 750ml",
      category: "Licores",
      unitPrice: 65000,
      boxPrice: 650000,
      stock: 18,
      minStock: 5,
      image: "🥃",
    },
    {
      id: "8410161011234",
      barcode: "8410161011234",
      name: "Vino Casillero del Diablo 750ml",
      category: "Vinos",
      unitPrice: 45000,
      boxPrice: 270000,
      stock: 25,
      minStock: 6,
      image: "🍷",
    },
    {
      id: "8410161015678",
      barcode: "8410161015678",
      name: "Vino Gato Negro Merlot 750ml",
      category: "Vinos",
      unitPrice: 32000,
      boxPrice: 192000,
      stock: 35,
      minStock: 8,
      image: "🍷",
    },
    {
      id: "7702116014567",
      barcode: "7702116014567",
      name: "Whisky Old Parr 12 años 750ml",
      category: "Licores",
      unitPrice: 125000,
      boxPrice: 1250000,
      stock: 12,
      minStock: 3,
      image: "🥃",
    },
    {
      id: "7702116015678",
      barcode: "7702116015678",
      name: "Vodka Smirnoff 750ml",
      category: "Licores",
      unitPrice: 45000,
      boxPrice: 450000,
      stock: 22,
      minStock: 6,
      image: "🍸",
    },
    {
      id: "7702259010234",
      barcode: "7702259010234",
      name: "Cerveza Corona Botella 355ml",
      category: "Cervezas",
      unitPrice: 4500,
      boxPrice: 108000,
      stock: 60,
      minStock: 15,
      image: "🍺",
    },
    {
      id: "7702259011345",
      barcode: "7702259011345",
      name: "Cerveza Heineken Lata 330ml",
      category: "Cervezas",
      unitPrice: 4000,
      boxPrice: 96000,
      stock: 72,
      minStock: 18,
      image: "🍺",
    },
    {
      id: "7702116016789",
      barcode: "7702116016789",
      name: "Baileys Original 750ml",
      category: "Cremas",
      unitPrice: 68000,
      boxPrice: 680000,
      stock: 15,
      minStock: 4,
      image: "🥛",
    },
    {
      id: "7899026001234",
      barcode: "7899026001234",
      name: "Energizante Red Bull 250ml",
      category: "Energizantes",
      unitPrice: 6500,
      boxPrice: 156000,
      stock: 90,
      minStock: 24,
      image: "⚡",
    },
    {
      id: "7702116017890",
      barcode: "7702116017890",
      name: "Ginebra Bombay Sapphire 750ml",
      category: "Licores",
      unitPrice: 95000,
      boxPrice: 950000,
      stock: 10,
      minStock: 3,
      image: "🍸",
    },
    {
      id: "7702259012456",
      barcode: "7702259012456",
      name: "Cerveza Budweiser Lata 330ml",
      category: "Cervezas",
      unitPrice: 3800,
      boxPrice: 91200,
      stock: 55,
      minStock: 12,
      image: "🍺",
    },
  ];

  const insert = db.prepare(`
    INSERT INTO productos
      (id, barcode, name, category, unitPrice, boxPrice, stock, minStock, image, active)
    VALUES
      (@id, @barcode, @name, @category, @unitPrice, @boxPrice, @stock, @minStock, @image, 1)
  `);

  const tx = db.transaction(() => {
    for (const p of products) insert.run(p);
  });

  tx();
  console.log(`✅ Seed productos: ${products.length} insertados`);
}

module.exports = { seedProductsIfNeeded };
