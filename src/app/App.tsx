import { useEffect, useState } from "react";
import logoImage from "../assets/sTOCKsEGURO.png";

import { ShoppingCart } from "./components/ShoppingCart";
import { ProductSearch } from "./components/ProductSearch";
import { PaymentPanel } from "./components/PaymentPanel";

import { StockEntry } from "./components/StockEntry";
import { StockMonitor } from "./components/StockMonitor";
import LoginView from "./components/LoginView";
import { HistoryModal } from "./components/HistoryModal";
import { History } from "lucide-react";


export interface Product {
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

export interface CartItem {
  product: Product;
  quantity: number;
}

type TabKey = "pos" | "stockEntry" | "stockMonitor";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatUSDFromCents(cents: number) {
  const safe = Number.isFinite(cents) ? cents : 0;
  return usd.format(safe / 100);
}

export default function App() {
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const stored = localStorage.getItem("theme");
    return stored === "dark" ? "dark" : "light";
  });

  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.email === "admin@stockseguro.com";

  const [activeTab, setActiveTab] = useState<TabKey>("pos");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  const cashierName = user ? user.nombre : "";

  // ✅ IMPORTANT: Tailwind dark mode uses `.dark` on the root element
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await window.api.getProducts();
        if (!mounted) return;

        if (!res.ok || !res.products) {
          console.error(res.error ?? "No se pudieron cargar productos");
          setProducts([]);
          return;
        }

        setProducts(res.products);
      } catch (e) {
        console.error("Error cargando productos", e);
        setProducts([]);
      } finally {
        if (mounted) setProductsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!user) return <LoginView onLogin={setUser} />;

  if (productsLoading) {
    return <div className="p-6 text-foreground">loading products...</div>;
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const calculateTotalCents = () =>
    cart.reduce((total, item) => total + item.product.unitPrice * item.quantity, 0);

  const handleCompleteSale = async (paymentMethod: string, receivedAmountCents?: number) => {
    const payload = {
      trabajadorId: user!.id,
      metodoPago: paymentMethod,
      montoRecibido: receivedAmountCents ?? null,
      items: cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };

    const res = await window.api.completeSale(payload);

    if (!res.ok) {
      alert(res.error ?? "No se pudo completar la venta.");
      return;
    }

    const productsRes = await window.api.getProducts();
    if (productsRes.ok && productsRes.products) setProducts(productsRes.products);

    clearCart();

    alert(
      `Sale completed. ID: ${res.ventaId ?? "-"} | Total: ${formatUSDFromCents(
        Number(res.total ?? 0)
      )}`
    );
  };

  const handleUpdateStock = (productId: string, quantity: number, operation: "add" | "subtract") => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const nextStock =
          operation === "add" ? p.stock + quantity : Math.max(0, p.stock - quantity);
        return { ...p, stock: nextStock };
      })
    );
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = async (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));

    const res = await window.api.deleteProduct(productId);
    if (!res.ok) {
      alert(res.error ?? "No se pudo eliminar el producto.");
      return;
    }

    const productsRes = await window.api.getProducts();
    if (productsRes.ok && productsRes.products) setProducts(productsRes.products);
  };

  const renderContent = () => {
    if (activeTab === "stockEntry") {
      return (
        <div className="p-6">
          <StockEntry
            products={products}
            trabajadorId={user!.id}
            onUpdateStock={handleUpdateStock}
            onRefreshProducts={async () => {
              const res = await window.api.getProducts();
              if (res.ok && res.products) setProducts(res.products);
            }}
          />
        </div>
      );
    }

    if (activeTab === "stockMonitor") {
      return (
        <div className="p-6">
          <StockMonitor
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        </div>
      );
    }

    return (
      <div className="flex h-[calc(100vh-140px)]">
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          <ProductSearch products={products} onAddToCart={addToCart} />
          <div className="flex-1 mt-6 overflow-hidden">
            <ShoppingCart
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
            />
          </div>
        </div>

        <div className="w-96 bg-card border-l border-border p-6">
          <PaymentPanel
            subtotalCents={calculateTotalCents()}
            onCompleteSale={handleCompleteSale}
            hasItems={cart.length > 0}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="StockSeguro" className="h-12 w-auto" />
            <div>
              <h1 className="text-foreground">
                {activeTab === "pos"
                  ? "Point Of Sale"
                  : activeTab === "stockEntry"
                    ? "Stock Entry and New Products"
                    : "Stock Seguro Stock In Real Time"}
              </h1>
              <p className="text-sm text-muted-foreground">Cashier System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("pos")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "pos"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Point of sale
              </button>

              <button
                onClick={() => setActiveTab("stockEntry")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "stockEntry"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Stock Entry
              </button>

              <button
                onClick={() => setActiveTab("stockMonitor")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "stockMonitor"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Stock in real time
              </button>
            </nav>

            <div className="inline-flex items-center gap-2">
              <div className="inline-block bg-accent text-accent-foreground px-4 py-2 rounded-lg">
                <p className="text-sm">
                  Welcome: <span className="font-medium">{cashierName}</span>
                </p>
              </div>

              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="px-4 py-2 rounded-lg border border-border text-sm bg-background hover:bg-muted"
              >
                {theme === "light" ? "🌙 Dark" : "☀️ Light"}
              </button>

              <button
                onClick={() => setUser(null)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90"
              >
                Close session
              </button>

              {isAdmin && (
  <button
    onClick={() => setShowHistoryModal(true)}
    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all 
               bg-gradient-to-r from-purple-600 to-green-600 
               hover:from-purple-700 hover:to-green-700 
               text-white shadow-lg hover:shadow-xl"
    title="View Activity History (Admin Only)"
  >
    <History className="h-4 w-4" />
    <span>History</span>
  </button>
)}
            </div>
          </div>
        </div>
      </header>

      {renderContent()}
      {showHistoryModal && isAdmin ? (
  <HistoryModal onClose={() => setShowHistoryModal(false)} />
) : null}

    </div>
  );
}
