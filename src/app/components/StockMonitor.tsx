import { useState } from 'react';
import { Search, Edit2, Trash2, AlertTriangle, TrendingDown, Package } from 'lucide-react';
import type { Product } from '../App';

interface StockMonitorProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export function StockMonitor({ products, onUpdateProduct, onDeleteProduct }: StockMonitorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm) ||
                         product.id.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    let matchesFilter = true;
    if (filterType === 'low') {
      matchesFilter = product.stock > 0 && product.stock <= product.minStock;
    } else if (filterType === 'out') {
      matchesFilter = product.stock === 0;
    }
    
    return matchesSearch && matchesCategory && matchesFilter;
  });

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.stock * p.unitPrice), 0);

  const handleSaveEdit = () => {
    if (editingProduct) {
      onUpdateProduct(editingProduct);
      setEditingProduct(null);
      alert('✓ Producto actualizado exitosamente');
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Statistics Bar */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-600 mb-1">Total Productos</p>
            <p className="text-2xl font-bold text-purple-700">{totalProducts}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Stock Total</p>
            <p className="text-2xl font-bold text-blue-700">{totalStock}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-600 mb-1">Stock Bajo</p>
            <p className="text-2xl font-bold text-yellow-700">{lowStockCount}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-1">Agotados</p>
            <p className="text-2xl font-bold text-red-700">{outOfStockCount}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Valor Inventario</p>
            <p className="text-lg font-bold text-green-700">${totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-4">
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'Todas las Categorías' : category}
              </button>
            ))}
          </div>

          {/* Stock Filter */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package className="h-3 w-3" />
              Todos
            </button>
            <button
              onClick={() => setFilterType('low')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                filterType === 'low'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingDown className="h-3 w-3" />
              Stock Bajo
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                filterType === 'out'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              Agotados
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Producto</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Código</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoría</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Precio Unit.</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Stock</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Stock Mín.</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div style={{ fontSize: '28px' }}>{product.image}</div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 font-mono">{product.barcode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-medium">${product.unitPrice.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className={`text-sm font-bold ${
                        product.stock === 0 
                          ? 'text-red-600' 
                          : product.stock <= product.minStock 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                      }`}>
                        {product.stock}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <p className="text-sm text-gray-600">{product.minStock}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.stock === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          Agotado
                        </span>
                      ) : product.stock <= product.minStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                          <TrendingDown className="h-3 w-3" />
                          Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          ✓ Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingProduct({ ...product })}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
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
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-medium text-lg mb-4">Editar Producto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2 text-sm">Nombre del Producto</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-sm">Código de Barras</label>
                  <input
                    type="text"
                    value={editingProduct.barcode}
                    onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2 text-sm">Categoría</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-sm">Precio Unitario</label>
                  <input
                    type="number"
                    value={editingProduct.unitPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2 text-sm">Precio por Caja</label>
                  <input
                    type="number"
                    value={editingProduct.boxPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, boxPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2 text-sm">Stock</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-2 text-sm">Stock Mínimo</label>
                  <input
                    type="number"
                    value={editingProduct.minStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
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
                Guardar Cambios
              </button>
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
