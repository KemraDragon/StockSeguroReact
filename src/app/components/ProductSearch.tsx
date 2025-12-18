import { useState, useRef, useEffect, useMemo } from "react";
import { Barcode, Search, Package } from "lucide-react";

interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  unitPrice: number; // cents
  boxPrice: number; // cents
  stock: number;
  minStock: number;
  image: string;
}

interface ProductSearchProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatUSDFromCents = (cents: number) => usd.format((Number(cents) || 0) / 100);

export function ProductSearch({ products, onAddToCart }: ProductSearchProps) {
  const [barcode, setBarcode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [lastScannedProduct]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const product = products.find((p) => p.barcode === barcode || p.id === barcode);

    if (product) {
      onAddToCart(product);
      setLastScannedProduct(product);
      setBarcode("");
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    } else {
      alert(`Product with code ${barcode} not found`);
      setBarcode("");
      barcodeInputRef.current?.focus();
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm);

    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-5">
      {/* Barcode Scanner */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Barcode className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <label className="font-medium text-gray-700 dark:text-gray-200">Scan Barcode</label>
        </div>

        <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan the product barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-purple-300 dark:border-purple-500 rounded-lg focus:border-purple-500 focus:outline-none bg-purple-50 dark:bg-neutral-800 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              autoComplete="off"
              style={{ fontSize: "16px", height: "56px" }}
            />
          </div>

          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            style={{ minWidth: "120px", height: "56px" }}
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>
        </form>

        {/* Last scanned product */}
        {lastScannedProduct && (
          <div className="mt-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/60 rounded-lg p-3 flex items-center gap-3">
            <div style={{ fontSize: "32px" }}>{lastScannedProduct.image}</div>
            <div className="flex-1">
              <p className="text-sm text-green-600 dark:text-green-300 font-medium">
                ✓ Added to cart
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {lastScannedProduct.name}
              </p>
            </div>
            <p className="font-medium text-green-600 dark:text-green-300">
              {formatUSDFromCents(lastScannedProduct.unitPrice)}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-neutral-700 pt-5">
        {/* Manual Search */}
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Manual Product Search
          </label>
        </div>

        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg focus:border-purple-400 focus:outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              style={{ fontSize: "14px" }}
            />
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === category
                  ? "bg-purple-600 text-white"
                  : "bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
              }`}
            >
              {category === "all" ? "All" : category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div
          className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 overflow-y-auto"
          style={{ maxHeight: "200px" }}
        >
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => {
                onAddToCart(product);
                setLastScannedProduct(product);
              }}
              className="bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700 rounded-lg p-2 transition-colors text-left relative"
            >
              <div className="text-center mb-1" style={{ fontSize: "28px" }}>
                {product.image}
              </div>

              <p
                className="font-medium text-xs mb-0.5 truncate text-gray-900 dark:text-gray-100"
                title={product.name}
                style={{ fontSize: "11px" }}
              >
                {product.name}
              </p>

              <p className="font-medium text-green-600 dark:text-green-400" style={{ fontSize: "11px" }}>
                {formatUSDFromCents(product.unitPrice)}
              </p>

              <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: "10px" }}>
                Stock: {product.stock}
              </p>

              {product.stock <= product.minStock && (
                <div
                  className="absolute top-1 right-1 bg-red-500 text-white rounded px-1 py-0.5"
                  style={{ fontSize: "9px" }}
                >
                  Low
                </div>
              )}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
