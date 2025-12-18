import { useMemo, useState } from "react";
import {
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingDown,
  Package,
} from "lucide-react";
import type { Product } from "../App";

interface StockMonitorProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatUSDFromCents(cents: number) {
  return usd.format((Number(cents) || 0) / 100);
}

function dollarsToCents(input: string) {
  const n = Number.parseFloat(input);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function centsToDollarsString(cents: number) {
  return ((Number(cents) || 0) / 100).toFixed(2);
}

export function StockMonitor({
  products,
  onUpdateProduct,
  onDeleteProduct,
}: StockMonitorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "low" | "out">("all");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ✅ inputs del modal en DÓLARES (string), pero guardaremos en CENTAVOS
  const [editUnitPriceUSD, setEditUnitPriceUSD] = useState<string>("0.00");
  const [editBoxPriceUSD, setEditBoxPriceUSD] = useState<string>("0.00");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm) ||
      product.id.includes(searchTerm);

    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    let matchesFilter = true;
    if (filterType === "low") {
      matchesFilter = product.stock > 0 && product.stock <= product.minStock;
    } else if (filterType === "out") {
      matchesFilter = product.stock === 0;
    }

    return matchesSearch && matchesCategory && matchesFilter;
  });

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.minStock
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  // ✅ totalValue en CENTAVOS
  const totalValueCents = products.reduce(
    (sum, p) => sum + p.stock * p.unitPrice,
    0
  );

  const openEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setEditUnitPriceUSD(centsToDollarsString(product.unitPrice));
    setEditBoxPriceUSD(centsToDollarsString(product.boxPrice));
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;

    const updated: Product = {
      ...editingProduct,
      unitPrice: dollarsToCents(editUnitPriceUSD),
      boxPrice: dollarsToCents(editBoxPriceUSD),
    };

    onUpdateProduct(updated);
    setEditingProduct(null);
    alert("✓ Product updated successfully");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Statistics Bar */}
      <div className="bg-white dark:bg-transparent border-b border-gray-200 dark:border-white/10 p-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-purple-50 dark:bg-white/5 border border-purple-200 dark:border-white/10 rounded-lg p-4">
            <p className="text-sm text-purple-600 dark:text-purple-300 mb-1">
              Total Products
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-200">
              {totalProducts}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-white/5 border border-blue-200 dark:border-white/10 rounded-lg p-4">
            <p className="text-sm text-blue-600 dark:text-blue-300 mb-1">
              Total Stock
            </p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
              {totalStock}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-white/5 border border-yellow-200 dark:border-white/10 rounded-lg p-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mb-1">
              Low Stock
            </p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-200">
              {lowStockCount}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-white/5 border border-red-200 dark:border-white/10 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-300 mb-1">
              Out of Stock
            </p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-200">
              {outOfStockCount}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-white/5 border border-green-200 dark:border-white/10 rounded-lg p-4">
            <p className="text-sm text-green-600 dark:text-green-300 mb-1">
              Inventory Value
            </p>
            <p className="text-lg font-bold text-green-700 dark:text-green-200">
              {formatUSDFromCents(totalValueCents)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-transparent border-b border-gray-200 dark:border-white/10 p-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/50" />
            <input
              type="text"
              placeholder="Search by name, code, or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40"
            />
          </div>
        </div>

        <div className="flex gap-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                }`}
              >
                {category === "all" ? "All Categories" : category}
              </button>
            ))}
          </div>

          {/* Stock Filter */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                filterType === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              }`}
            >
              <Package className="h-3 w-3" />
              All
            </button>

            <button
              onClick={() => setFilterType("low")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                filterType === "low"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              }`}
            >
              <TrendingDown className="h-3 w-3" />
              Low
            </button>

            <button
              onClick={() => setFilterType("out")}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                filterType === "out"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Out
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-white/80">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-white/80">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-white/80">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-white/80">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-white/80">
                  Stock
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-white/80">
                  Min Stock
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-white/80">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-white/80">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-400 dark:text-white/40"
                  >
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div style={{ fontSize: "28px" }}>{product.image}</div>
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {product.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 dark:text-white/60 font-mono">
                        {product.barcode}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 rounded text-xs">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatUSDFromCents(product.unitPrice)}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <p
                        className={`text-sm font-bold ${
                          product.stock === 0
                            ? "text-red-600 dark:text-red-300"
                            : product.stock <= product.minStock
                            ? "text-yellow-600 dark:text-yellow-300"
                            : "text-green-600 dark:text-green-300"
                        }`}
                      >
                        {product.stock}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <p className="text-sm text-gray-600 dark:text-white/60">
                        {product.minStock}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-center">
                      {product.stock === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-200 rounded text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Out
                        </span>
                      ) : product.stock <= product.minStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-200 rounded text-xs font-medium">
                          <TrendingDown className="h-3 w-3" />
                          Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-200 rounded text-xs font-medium">
                          ✓ OK
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            const ok = window.confirm(
                              `Are you sure you want to delete "${product.name}"?\n\n(It will be hidden from the system)`
                            );
                            if (!ok) return;
                            onDeleteProduct(product.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f1218] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-transparent dark:border-white/10">
            <h3 className="font-medium text-lg mb-4 text-gray-900 dark:text-white">
              Edit Product
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2 text-sm text-gray-900 dark:text-white/80">
                  Product Name
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-sm text-gray-900 dark:text-white/80">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={editingProduct.barcode}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        barcode: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2 text-sm text-gray-900 dark:text-white/80">
                    Category
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                  >
                    {/* ✅ coherente con tu catálogo */}
                    <option value="Beer">Beer</option>
                    <option value="Beers">Beers</option>
                    <option value="Spirits">Spirits</option>
                    <option value="Wine">Wine</option>
                    <option value="Mixers">Mixers</option>
                    <option value="Liqueurs">Liqueurs</option>
                  </select>
                </div>
              </div>

              {/* ✅ precios en USD (string), guardamos en cents */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-sm text-gray-900 dark:text-white/80">
                    Unit Price (USD)
                  </label>
                  <input
                    type="number"
                    value={editUnitPriceUSD}
                    onChange={(e) => setEditUnitPriceUSD(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
                    Stored as cents: {dollarsToCents(editUnitPriceUSD)}
                  </p>
                </div>

                <div>
                  <label className="block font-medium mb-2 text-sm text-gray-900 dark:text-white/80">
                    Box Price (USD)
                  </label>
                  <input
                    type="number"
                    value={editBoxPriceUSD}
                    onChange={(e) => setEditBoxPriceUSD(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                  />
                  <p className="text-xs text-gray-500 dark:text-white/50 mt-1">
                    Stored as cents: {dollarsToCents(editBoxPriceUSD)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-sm text-gray-900 dark:text-white/80">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2 text-sm text-gray-900 dark:text-white/80">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    value={editingProduct.minStock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        minStock: Number.parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg focus:border-purple-500 focus:outline-none bg-white dark:bg-white/5 text-gray-900 dark:text-white"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-white/10 dark:hover:bg-white/15 dark:text-white px-6 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
