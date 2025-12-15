import { useState, useRef, useEffect } from 'react';
import { Barcode, Search, Package } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface Product {
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

interface ProductSearchProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductSearch({ products, onAddToCart }: ProductSearchProps) {
  const [barcode, setBarcode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Auto-focus en el input de código de barras al cargar y después de cada scan
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [lastScannedProduct]);

  // Búsqueda automática por código de barras
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const product = products.find(p => 
      p.barcode === barcode || p.id === barcode
    );

    if (product) {
      onAddToCart(product);
      setLastScannedProduct(product);
      
      // Limpiar el input y mantener el foco
      setBarcode('');
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    } else {
      // Producto no encontrado
      alert(`Producto con código ${barcode} no encontrado`);
      setBarcode('');
      barcodeInputRef.current?.focus();
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      {/* Escáner de Código de Barras - Elemento Principal */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Barcode className="h-5 w-5 text-purple-600" />
          <label className="font-medium text-gray-700">Escanear Código de Barras</label>
        </div>
        <form onSubmit={handleBarcodeSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Escanee el código de barras del producto..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none bg-purple-50 text-base"
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
        
        {/* Último producto escaneado */}
        {lastScannedProduct && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <div style={{ fontSize: '32px' }}>{lastScannedProduct.image}</div>
            <div className="flex-1">
              <p className="text-sm text-green-600 font-medium">✓ Producto agregado</p>
              <p className="font-medium">{lastScannedProduct.name}</p>
            </div>
            <p className="font-medium text-green-600">
              ${lastScannedProduct.unitPrice.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-5">
        {/* Búsqueda Manual (Secundaria) */}
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-600">Búsqueda Manual de Productos</label>
        </div>

        {/* Search Bar Manual */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:border-purple-400 focus:outline-none"
              style={{ fontSize: '14px' }}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedCategory === category 
                  ? "bg-purple-600 text-white" 
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {category === 'all' ? 'Todos' : category}
            </button>
          ))}
        </div>

        {/* Product Grid - Compacto */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 overflow-y-auto" style={{ maxHeight: '200px' }}>
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => {
                onAddToCart(product);
                setLastScannedProduct(product);
              }}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-2 transition-colors text-left relative"
            >
              <div className="text-center mb-1" style={{ fontSize: '28px' }}>{product.image}</div>
              <p className="font-medium text-xs mb-0.5 truncate" title={product.name} style={{ fontSize: '11px' }}>
                {product.name}
              </p>
              <p className="font-medium text-green-600" style={{ fontSize: '11px' }}>
                ${product.unitPrice.toLocaleString()}
              </p>
              <p className="text-gray-500" style={{ fontSize: '10px' }}>Stock: {product.stock}</p>
              
              {/* Badge de stock bajo */}
              {product.stock <= product.minStock && (
                <div className="absolute top-1 right-1 bg-red-500 text-white rounded px-1 py-0.5" style={{ fontSize: '9px' }}>
                  Bajo
                </div>
              )}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No se encontraron productos</p>
          </div>
        )}
      </div>
    </div>
  );
}