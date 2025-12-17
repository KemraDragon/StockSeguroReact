import { useEffect, useState } from "react";
import logoImage from "../assets/sTOCKsEGURO.png";

import { ShoppingCart } from "./components/ShoppingCart";
import { ProductSearch } from "./components/ProductSearch";
import { PaymentPanel } from "./components/PaymentPanel";

import { StockEntry } from "./components/StockEntry";
import { StockMonitor } from "./components/StockMonitor";
import LoginView from "./components/LoginView";

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  unitPrice: number;
  boxPrice: number;
  stock: number;
  minStock: number;
  image: string;
}

type User = { id: number; rut: string; nombre: string };

export interface CartItem {
  product: Product;
  quantity: number;
}

type TabKey = "pos" | "stockEntry" | "stockMonitor";

export default function App() {
  // ✅ hooks arriba
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pos");

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);

  const cashierName = user ? user.nombre : "";

  // ✅ cargar productos desde SQLite (Electron IPC)
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

  // ✅ login gate
  if (!user) {
    return <LoginView onLogin={setUser} />;
  }

  if (productsLoading) {
    return <div style={{ padding: 20 }}>Cargando productos...</div>;
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
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce(
      (total, item) => total + item.product.unitPrice * item.quantity,
      0
    );
  };

  const handleCompleteSale = async (paymentMethod: string, receivedAmount?: number) => {
  const payload = {
    trabajadorId: user!.id,
    metodoPago: paymentMethod,
    montoRecibido: receivedAmount ?? null,
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

  // refrescar productos desde DB (para ver stock actualizado real)
  const productsRes = await window.api.getProducts();
  if (productsRes.ok && productsRes.products) setProducts(productsRes.products);

  clearCart();alert(
  `Venta completada. ID: ${res.ventaId ?? "-"} | Total: $${res.total?.toLocaleString() ?? "0"}`
);
};

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => {
      const exists = prev.some(
        (p) => p.id === product.id || p.barcode === product.barcode
      );
      if (exists) {
        alert("Ya existe un producto con ese ID/Código de barras.");
        return prev;
      }
      return [product, ...prev];
    });
  };

  const handleUpdateStock = (
    productId: string,
    quantity: number,
    operation: "add" | "subtract"
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;

        const nextStock =
          operation === "add"
            ? p.stock + quantity
            : Math.max(0, p.stock - quantity);

        return { ...p, stock: nextStock };
      })
    );
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeleteProduct = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const renderContent = () => {
    if (activeTab === "stockEntry") {
      return (
        <div className="p-6">
          <StockEntry
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateStock={handleUpdateStock}
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

        <div className="w-96 bg-white border-l border-gray-200 p-6">
          <PaymentPanel
            total={calculateTotal()}
            onCompleteSale={handleCompleteSale}
            hasItems={cart.length > 0}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={logoImage} alt="StockSeguro" className="h-12 w-auto" />
            <div>
              <h1 className="text-foreground">
                {activeTab === "pos"
                  ? "Punto de Venta"
                  : activeTab === "stockEntry"
                  ? "Ingreso de Stock"
                  : "Stock en Tiempo Real"}
              </h1>
              <p className="text-sm text-muted-foreground">Sistema de Cajero</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("pos")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "pos"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Punto de Venta
              </button>

              <button
                onClick={() => setActiveTab("stockEntry")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "stockEntry"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Ingreso Stock
              </button>

              <button
                onClick={() => setActiveTab("stockMonitor")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "stockMonitor"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Stock Real
              </button>
            </nav>

            <div className="inline-flex items-center gap-2">
              <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <p className="text-sm">
                  Bienvenido: <span className="font-medium">{cashierName}</span>
                </p>
              </div>

              <button
                onClick={() => setUser(null)}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-gray-800"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {renderContent()}
    </div>
  );
}
