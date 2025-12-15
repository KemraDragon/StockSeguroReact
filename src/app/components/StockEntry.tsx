import { useState, useRef, useEffect } from 'react';
import { PackagePlus, Barcode, Plus, Search } from 'lucide-react';
import type { Product } from '../App';

interface StockEntryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateStock: (productId: string, quantity: number, type: 'add' | 'subtract') => void;
}

export function StockEntry({ products, onAddProduct, onUpdateStock }: StockEntryProps) {
  const [mode, setMode] = useState<'new' | 'existing'>('existing');
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Nuevo producto form
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

  const handleCreateProduct = () => {
    if (!newProduct.barcode || !newProduct.name || !newProduct.unitPrice) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    // Verificar que el código de barras no exista
    const exists = products.find(p => p.barcode === newProduct.barcode);
    if (exists) {
      alert('Ya existe un producto con este código de barras');
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
      image: newProduct.image as string
    };

    onAddProduct(product);
    
    alert(`✓ Producto creado exitosamente: ${product.name}`);
    
    // Resetear formulario
    setNewProduct({
      barcode: '',
      name: '',
      category: 'Licores',
      unitPrice: 0,
      boxPrice: 0,
      stock: 0,
      minStock: 5,
      image: '🍶'
    });
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
    <div className="flex h-full">
      {/* Left Panel - Form */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Mode Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <label className="block font-medium mb-3">Tipo de Operación</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('existing')}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  mode === 'existing'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Plus className="h-5 w-5" />
                <span>Crear Producto Nuevo</span>
              </button>
            </div>
          </div>

          {/* Existing Product Mode */}
          {mode === 'existing' && (
            <div className="space-y-6">
              {/* Barcode Scanner */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Barcode className="h-5 w-5 text-purple-600" />
                  <label className="font-medium">Escanear Código de Barras del Producto</label>
                </div>
                <form onSubmit={handleBarcodeSearch} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      placeholder="Escanee o ingrese el código de barras..."
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-purple-50"
                      autoComplete="off"
                      style={{ fontSize: '16px', height: '56px' }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                    style={{ minWidth: '120px', height: '56px' }}
                  >
                    <Search className="h-5 w-5" />
                    <span>Buscar</span>
                  </button>
                </form>
              </div>

              {/* Selected Product Display */}
              {selectedProduct && (
                <div className="bg-white rounded-lg border border-gray-200 p-5">
                  <label className="font-medium block mb-3">Producto Seleccionado</label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-4 mb-4">
                    <div style={{ fontSize: '48px' }}>{selectedProduct.image}</div>
                    <div className="flex-1">
                      <p className="font-medium text-lg">{selectedProduct.name}</p>
                      <p className="text-sm text-gray-600">Código: {selectedProduct.barcode}</p>
                      <p className="text-sm text-gray-600">Categoría: {selectedProduct.category}</p>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        Stock Actual: <span className="text-green-600">{selectedProduct.stock} unidades</span>
                      </p>
                    </div>
                  </div>

                  <label className="font-medium block mb-2">Cantidad a Agregar</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      placeholder="Cantidad de unidades"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      style={{ fontSize: '16px' }}
                      min="1"
                    />
                    <button
                      onClick={handleAddStock}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
                      style={{ minWidth: '150px' }}
                    >
                      <Plus className="h-5 w-5" />
                      <span>Agregar Stock</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Product Mode */}
          {mode === 'new' && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <h3 className="font-medium mb-4">Crear Nuevo Producto</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">Código de Barras *</label>
                    <input
                      type="text"
                      placeholder="7702116011239"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Categoría *</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ 
                        ...newProduct, 
                        category: e.target.value,
                        image: categoryIcons[e.target.value] || '🍶'
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    >
                      <option value="Licores">Licores</option>
                      <option value="Cervezas">Cervezas</option>
                      <option value="Vinos">Vinos</option>
                      <option value="Cremas">Cremas</option>
                      <option value="Energizantes">Energizantes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2">Nombre del Producto *</label>
                  <input
                    type="text"
                    placeholder="Ej: Cerveza Corona 355ml"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">Precio Unitario *</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProduct.unitPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Precio por Caja</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProduct.boxPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, boxPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium mb-2">Stock Inicial</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-2">Stock Mínimo</label>
                    <input
                      type="number"
                      placeholder="5"
                      value={newProduct.minStock}
                      onChange={(e) => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreateProduct}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                  style={{ minHeight: '48px' }}
                >
                  <Plus className="h-5 w-5" />
                  <span>Crear Producto</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Quick Product List */}
      <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <h3 className="font-medium mb-4">Productos Recientes</h3>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-400 focus:outline-none text-sm"
          />
        </div>

        <div className="space-y-2">
          {filteredProducts.slice(0, 15).map(product => (
            <button
              key={product.id}
              onClick={() => {
                setMode('existing');
                setSelectedProduct(product);
              }}
              className="w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div style={{ fontSize: '24px' }}>{product.image}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.barcode}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Stock: <span className={product.stock <= product.minStock ? 'text-red-600 font-medium' : 'text-green-600'}>{product.stock}</span>
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
