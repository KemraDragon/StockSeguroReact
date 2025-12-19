import { useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  Plus,
  Minus,
  Package,
  Search,
  Tag,
  DollarSign,
  Layers,
} from "lucide-react";
import type { Product } from "../App";

interface StockEntryProps {
  products: Product[];
  trabajadorId: number;
  onUpdateStock: (productId: string, quantity: number, operation: "add" | "subtract") => void;
  onRefreshProducts: () => Promise<void>;
}

type Mode = "existing" | "new";

const categoryIcons: Record<string, string> = {
  Beer: "🍺",
  Beers: "🍺",
  Liquours: "🥃",
  Liqueurs: "🥃",
  Mixers: "🥤",
  Spirits: "🥃",
  Wine: "🍷",
  Other: "📦",
};

export function StockEntry({ products, trabajadorId, onRefreshProducts }: StockEntryProps) {
  const [mode, setMode] = useState<Mode>("existing");

  const [showSubtractModal, setShowSubtractModal] = useState(false);
  const [subtractReason, setSubtractReason] = useState("");
  const [barcode, setBarcode] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState<string>("");

  // New product form
  const [newProduct, setNewProduct] = useState<{
    id: string;
    barcode: string;
    name: string;
    category: string;
    unitPrice: string; // dollars input
    boxPrice: string;  // dollars input
    stock: string;
    minStock: string;
    image: string;
  }>({
    id: "",
    barcode: "",
    name: "",
    category: "Beer",
    unitPrice: "",
    boxPrice: "",
    stock: "",
    minStock: "",
    image: "📦",
  });

  const [creating, setCreating] = useState(false);
  const [addingStock, setAddingStock] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // focus when switching mode
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  }, [mode]);

  const recentProducts = useMemo(() => {
    // right list: for now show first ones (you can change it to "last used" later)
    return products.slice(0, 12);
  }, [products]);

  const findByBarcode = (code: string) => {
    const c = code.trim();
    if (!c) return null;
    return products.find((p) => String(p.barcode).trim() === c) ?? null;
  };

  const handleBarcodeSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const found = findByBarcode(barcode);
    if (!found) {
      alert("Product not found. Please verify the barcode.");
      setSelectedProduct(null);
      return;
    }
    setSelectedProduct(found);

    // if in new mode, prefill barcode
    if (mode === "new") {
      setNewProduct((prev) => ({ ...prev, barcode: found.barcode }));
    }
  };

  const handleAddStock = async () => {
    if (!selectedProduct) return;

    const qty = Number(stockQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      alert("Enter a valid quantity.");
      return;
    }

    setAddingStock(true);
    try {
      const res = await window.api.adjustStock({
        workerId: trabajadorId,
        productId: selectedProduct.id,
        operation: "add",
        quantity: qty,
        // reason opcional en add
      });

      if (!res.ok) {
        alert(res.error ?? "Could not add stock.");
        return;
      }

      // refresco real desde DB
      await onRefreshProducts();

      // re-seleccionar producto actualizado
      const refreshed = findByBarcode(selectedProduct.barcode);
      setSelectedProduct(refreshed ?? null);

      setStockQuantity("");
    } finally {
      setAddingStock(false);
    }
  };

  const handleSubtractStock = async () => {
    if (!selectedProduct) return;

    const qty = Number(stockQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      alert("Enter a valid quantity.");
      return;
    }

    setSubtractReason("");
    setShowSubtractModal(true);
  };

  const dollarsToCents = (v: string) => {
    const n = Number(String(v).replace(",", "."));
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  };

  const handleCreateProduct = async () => {
    // minimal validations
    if (!newProduct.id.trim()) return alert("Missing ID.");
    if (!newProduct.barcode.trim()) return alert("Missing barcode.");
    if (!newProduct.name.trim()) return alert("Missing name.");
    if (!newProduct.category.trim()) return alert("Missing category.");

    const unitPrice = dollarsToCents(newProduct.unitPrice);
    const boxPrice = dollarsToCents(newProduct.boxPrice);

    const stock = Number(newProduct.stock);
    const minStock = Number(newProduct.minStock);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return alert("Invalid unit price.");
    if (!Number.isFinite(boxPrice) || boxPrice < 0) return alert("Invalid box price.");
    if (!Number.isFinite(stock) || stock < 0) return alert("Invalid stock.");
    if (!Number.isFinite(minStock) || minStock < 0) return alert("Invalid minimum stock.");

    setCreating(true);
    try {
      const payload = {
        id: newProduct.id.trim(),
        barcode: newProduct.barcode.trim(),
        name: newProduct.name.trim(),
        category: newProduct.category.trim(),
        unitPrice,
        boxPrice,
        stock,
        minStock,
        image: newProduct.image?.trim() || "📦",
      };

      const res = await window.api.createProduct(payload);

      if (!res?.ok) {
        alert(res?.error ?? "Could not create the product.");
        return;
      }

      await onRefreshProducts();

      // clear and go back to existing
      setNewProduct({
        id: "",
        barcode: "",
        name: "",
        category: "Beer",
        unitPrice: "",
        boxPrice: "",
        stock: "",
        minStock: "",
        image: "📦",
      });
      setBarcode("");
      setSelectedProduct(null);
      setMode("existing");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)]">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* LEFT */}
        <div className="flex-1">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stock Entry</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add or subtract stock for existing products, or create a new product.
            </p>
          </div>

          {/* Mode selector */}
          <div className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-4 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Operation Type</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose whether you will work with an existing or new product.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    mode === "existing"
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-neutral-900 dark:text-gray-200 dark:border-neutral-800 dark:hover:bg-neutral-900",
                  ].join(" ")}
                >
                  Add Stock to Existing
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    mode === "new"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-neutral-900 dark:text-gray-200 dark:border-neutral-800 dark:hover:bg-neutral-900",
                  ].join(" ")}
                >
                  Create New Product
                </button>
              </div>
            </div>
          </div>

          {/* Barcode panel */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 dark:bg-neutral-900 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-3">
              <Barcode className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Scan Product Barcode
              </p>
            </div>

            <form onSubmit={handleBarcodeSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan or enter the barcode..."
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none bg-gray-50 focus:bg-white dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100 dark:focus:bg-neutral-900"
                  autoComplete="off"
                  style={{ fontSize: "16px", height: "56px" }}
                />
              </div>

              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                style={{ minWidth: "130px", height: "56px" }}
              >
                <Search className="h-5 w-5" />
                <span>Search</span>
              </button>
            </form>
          </div>

          {/* Existing product flow */}
          {mode === "existing" ? (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-4 dark:bg-neutral-900 dark:border-neutral-800">
              {!selectedProduct ? (
                <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                  <Package className="h-5 w-5 mt-0.5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <p className="font-semibold">No product selected</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Scan or type a barcode to select a product.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {selectedProduct.image || categoryIcons[selectedProduct.category] || "📦"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedProduct.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedProduct.barcode}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-neutral-900 dark:text-gray-200">
                            <Tag className="h-3.5 w-3.5" />
                            {selectedProduct.category}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-neutral-900 dark:text-gray-200">
                            <Layers className="h-3.5 w-3.5" />
                            Stock: {selectedProduct.stock}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Minimum stock</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{selectedProduct.minStock}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none dark:bg-black dark:border-neutral-800 dark:text-gray-100"
                      style={{ fontSize: "16px" }}
                      min="1"
                      placeholder="Quantity"
                    />

                    <button
                      type="button"
                      disabled={addingStock}
                      onClick={handleAddStock}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      style={{ minWidth: "170px" }}
                    >
                      <Plus className="h-5 w-5" />
                      <span>{addingStock ? "Processing..." : "Add Stock"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={addingStock}
                      onClick={handleSubtractStock}
                      className="bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                      style={{ minWidth: "170px" }}
                    >
                      <Minus className="h-5 w-5" />
                      <span>{addingStock ? "Processing..." : "Subtract Stock"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // New product flow
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-4 dark:bg-neutral-900 dark:border-neutral-800">
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Create Product</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fill in the details and save the product to the database.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">ID</label>
                  <input
                    value={newProduct.id}
                    onChange={(e) => setNewProduct((p) => ({ ...p, id: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                    placeholder="SKU / ID"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Barcode</label>
                  <input
                    value={newProduct.barcode}
                    onChange={(e) => setNewProduct((p) => ({ ...p, barcode: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                    placeholder="0123456789012"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">Name</label>
                  <input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                    placeholder="Product name"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Category</label>
                  <input
                    value={newProduct.category}
                    onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                    placeholder="Beer / Wine / Spirits..."
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Icon (emoji)</label>
                  <input
                    value={newProduct.image}
                    onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                    placeholder="📦"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Unit price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={newProduct.unitPrice}
                      onChange={(e) => setNewProduct((p) => ({ ...p, unitPrice: e.target.value }))}
                      className="mt-1 w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                      placeholder="9.99"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Box price (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={newProduct.boxPrice}
                      onChange={(e) => setNewProduct((p) => ({ ...p, boxPrice: e.target.value }))}
                      className="mt-1 w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                      placeholder="29.99"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Initial stock</label>
                  <input
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Minimum stock</label>
                  <input
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct((p) => ({ ...p, minStock: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-100"
                    placeholder="3"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end">
                <button
                  type="button"
                  disabled={creating}
                  onClick={handleCreateProduct}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  {creating ? "Creating..." : "Create Product"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Subtract reason modal */}
        {showSubtractModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* backdrop */}
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowSubtractModal(false)}
              aria-label="Close"
            />

            {/* modal */}
            <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Subtraction reason
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Write a <b>short and precise</b> reason (e.g., “Broken/damaged”, “Expired”, “Counting error”).
              </p>

              <textarea
                value={subtractReason}
                onChange={(e) => setSubtractReason(e.target.value)}
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder='E.g., "Broken/damaged"'
              />

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  onClick={() => {
                    setShowSubtractModal(false);
                    setSubtractReason("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600"
                  onClick={async () => {
                    // quick validation
                    const reason = subtractReason.trim();
                    if (!reason) {
                      alert("You must enter a reason (short and precise).");
                      return;
                    }

                    if (!selectedProduct) return;

                    const qty = Number(stockQuantity);
                    if (!Number.isFinite(qty) || qty <= 0) {
                      alert("Enter a valid quantity.");
                      return;
                    }

                    setAddingStock(true);
                    try {
                      // ✅ for now we perform the normal subtraction (DB logging comes in the next step)
                      const res = await window.api.adjustStock({
                        workerId: trabajadorId,
                        productId: selectedProduct.id,
                        operation: "subtract",
                        quantity: qty,
                        reason,
                      });

                      if (!res?.ok) {
                        alert(res?.error ?? "Could not adjust stock.");
                        return;
                      }

                      await onRefreshProducts();


                      const refreshed = findByBarcode(selectedProduct.barcode);
                      setSelectedProduct(refreshed ?? null);

                      setStockQuantity("");
                      setShowSubtractModal(false);
                      setSubtractReason("");
                    } finally {
                      setAddingStock(false);
                    }
                  }}
                >
                  Confirm subtraction
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* RIGHT SIDEBAR */}
        <div className="w-full xl:w-96">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 dark:bg-neutral-900 dark:border-neutral-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Recent products
            </p>

            <div className="space-y-2">
              {recentProducts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setMode("existing");
                    setBarcode(p.barcode);
                    setSelectedProduct(p);
                    setStockQuantity("");
                    barcodeInputRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <div className="text-xl">
                    {p.image || categoryIcons[p.category] || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate dark:text-gray-400">{p.barcode}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Stock: {p.stock}</p>
                  </div>
                </button>
              ))}
              {recentProducts.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No products.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
