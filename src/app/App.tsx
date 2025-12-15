import { useMemo, useState } from "react";
import logoImage from "../assets/sTOCKsEGURO.png";

import { ShoppingCart } from "./components/ShoppingCart";
import { ProductSearch } from "./components/ProductSearch";
import { PaymentPanel } from "./components/PaymentPanel";

import { StockEntry } from "./components/StockEntry";
import { StockMonitor } from "./components/StockMonitor";

// ✅ Tipo base para todo el sistema (solo UI por ahora)
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

// Mock inicial (antes era availableProducts)
const initialProducts: Product[] = [
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

export interface CartItem {
  product: Product;
  quantity: number;
}

type TabKey = "pos" | "stockEntry" | "stockMonitor";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("pos");

  // ✅ estado compartido entre todas las vistas
  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashierName] = useState("Kevin Jara");

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

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

  // ✅ POS: al “completar venta” bajamos stock de products (solo registro)
  const handleCompleteSale = (paymentMethod: string, receivedAmount?: number) => {
    const total = calculateTotal();

    // Actualizar stock (restar por cada item)
    setProducts((prev) => {
      const next = prev.map((p) => ({ ...p }));
      const nextMap = new Map(next.map((p) => [p.id, p]));

      cart.forEach((item) => {
        const target = nextMap.get(item.product.id);
        if (!target) return;

        target.stock = Math.max(0, target.stock - item.quantity);
      });

      return Array.from(nextMap.values());
    });

    console.log("Venta completada:", {
      cart,
      total,
      paymentMethod,
      receivedAmount,
      cashier: cashierName,
      timestamp: new Date().toISOString(),
    });

    clearCart();
    alert(
      `Venta completada exitosamente!\nTotal: $${total.toLocaleString()}\nMétodo: ${paymentMethod}`
    );
  };

  // ✅ Inventario: agregar producto nuevo
  const handleAddProduct = (product: Product) => {
    setProducts((prev) => {
      // Evita duplicados por id/barcode (solo UI)
      const exists = prev.some((p) => p.id === product.id || p.barcode === product.barcode);
      if (exists) {
        alert("Ya existe un producto con ese ID/Código de barras.");
        return prev;
      }
      return [product, ...prev];
    });
  };

  // ✅ Inventario: sumar/restar stock
  const handleUpdateStock = (
    productId: string,
    quantity: number,
    operation: "add" | "subtract"
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;

        const nextStock =
          operation === "add" ? p.stock + quantity : Math.max(0, p.stock - quantity);

        return { ...p, stock: nextStock };
      })
    );
  };

  // ✅ Monitor: editar producto (modal)
  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // ✅ Monitor: eliminar producto
  const handleDeleteProduct = (productId: string) => {
    // si está en carrito, lo sacamos (para evitar inconsistencias visuales)
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

    // POS (tu UI actual)
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
      {/* Header + Tabs */}
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
            {/* Tabs */}
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

            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              <p className="text-sm">
                Bienvenido: <span className="font-medium">{cashierName}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {renderContent()}
    </div>
  );
}
