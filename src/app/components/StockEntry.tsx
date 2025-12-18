import { useState, useRef, useEffect } from 'react';
import { PackagePlus, Barcode, Plus, Search } from 'lucide-react';
import type { Product } from '../App';

interface StockEntryProps {
  products: Product[];
  onRefreshProducts: () => Promise<void> | void;
  onUpdateStock: (productId: string, quantity: number, type: 'add' | 'subtract') => void;
}

export function StockEntry({ products, onRefreshProducts, onUpdateStock }: StockEntryProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('existing');
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    barcode: '',
    name: '',
    category: 'Licores',
    unitPrice: 0,
    boxPrice: 0,
    stock: 0,
    minStock: 5,
    image: '🍶'
  });

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'existing') {
      barcodeInputRef.current?.focus();
    }
  }, [mode, selectedProduct]);

  const handleBarcodeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const product = products.find(p => p.barcode === barcode || p.id === barcode);

    if (product) {
      setSelectedProduct(product);
      setBarcode('');
    } else {
      alert(`Producto con código ${barcode} no encontrado`);
      setBarcode('');
    }
  };

  const handleAddStock = () => {
    if (!selectedProduct || !stockQuantity) {
      alert('Por favor complete todos los campos');
      return;
    }

    const quantity = parseInt(stockQuantity);
    if (quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    onUpdateStock(selectedProduct.id, quantity, 'add');

    alert(`✓ Se agregaron ${quantity} unidades de ${selectedProduct.name}\nNuevo stock: ${selectedProduct.stock + quantity}`);

    setSelectedProduct(null);
    setStockQuantity('');
    barcodeInputRef.current?.focus();
  };

  const handleCreateProduct = async () => {
    if (!newProduct.barcode || !newProduct.name || !newProduct.unitPrice) {
      alert("Por favor complete todos los campos obligatorios");
      return;
    }

    const exists = products.find((p) => p.barcode === newProduct.barcode);
    if (exists) {
      alert("Ya existe un producto con este código de barras");
      return;
    }

    const product: Product = {
      id: newProduct.barcode as string,
      barcode: newProduct.barcode as string,
      name: newProduct.name as string,
      category: newProduct.category as string,
      unitPrice: newProduct.unitPrice as number,
      boxPrice: newProduct.boxPrice as number,
      stock: newProduct.stock as number,
      minStock: newProduct.minStock as number,
      image: newProduct.image as string,
    };

    const res = await window.api.createProduct(product);
    if (!res.ok) {
      alert(res.error ?? "No se pudo crear el producto.");
      return;
    }

    alert(`✓ Producto creado exitosamente: ${product.name}`);

    setNewProduct({
      barcode: "",
      name: "",
      category: "Licores",
      unitPrice: 0,
      boxPrice: 0,
      stock: 0,
      minStock: 5,
      image: "🍶",
    });

    await onRefreshProducts();
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm) ||
    product.id.includes(searchTerm)
  );

  const categoryIcons: Record<string, string> = {
    'Licores': '🍶',
    'Cervezas': '🍺',
    'Vinos': '🍷',
    'Cremas': '🥛',
    'Energizantes': '⚡'
  };

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Left Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <label className="block font-medium mb-3">Tipo de Operación</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('existing')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  mode === 'existing'
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                <PackagePlus className="h-5 w-5" />
                <span>Agregar Stock a Existente</span>
              </button>

              <button
                onClick={() => setMode('new')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  mode === 'new'
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                <Plus className="h-5 w-5" />
                <span>Crear Producto Nuevo</span>
              </button>
            </div>
          </div>

          {mode === 'existing' && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Barcode className="h-5 w-5 text-purple-600" />
                  <label className="font-medium">Escanear Código de Barras del Producto</label>
                </div>

                <form onSubmit={handleBarcodeSearch} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Escanee o ingrese el código de barras..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none"
                      autoComplete="off"
                      style={{ fontSize: '16px', height: '56px' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                    style={{ minWidth: '120px', height: '56px' }}
                  >
                    <Search className="h-5 w-5" />
                    <span>Buscar</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-96 bg-card border-l border-border p-6 overflow-y-auto">
        <h3 className="font-medium mb-4">Productos Recientes</h3>

        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-input-background mb-4"
        />

        <div className="space-y-2">
          {filteredProducts.slice(0, 15).map(product => (
            <button
              key={product.id}
              onClick={() => {
                setMode('existing');
                setSelectedProduct(product);
              }}
              className="w-full text-left bg-muted hover:bg-accent border border-border rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div style={{ fontSize: '24px' }}>{product.image}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.barcode}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
