import { Minus, Plus, Trash2, ShoppingCart as CartIcon } from 'lucide-react';
import type { CartItem } from '../App';

interface ShoppingCartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export function ShoppingCart({ cart, onUpdateQuantity, onRemoveItem, onClearCart }: ShoppingCartProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <CartIcon className="h-5 w-5 text-gray-600" />
          <h2>Carrito de Compras</h2>
          {itemCount > 0 && (
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-sm">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        {cart.length > 0 && (
          <button 
            onClick={onClearCart} 
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Limpiar Todo
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <CartIcon className="h-16 w-16 mb-3" />
            <p>El carrito está vacío</p>
            <p className="text-sm">Agrega productos para comenzar</p>
          </div>
        ) : (
          cart.map(item => (
            <div 
              key={item.product.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3"
            >
              <div style={{ fontSize: '32px' }}>{item.product.image}</div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.product.name}</p>
                <p className="text-sm text-gray-500">{item.product.id}</p>
                <p className="text-sm font-medium text-green-600">
                  ${item.product.unitPrice.toLocaleString()} c/u
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                
                <div className="w-12 text-center font-medium">
                  {item.quantity}
                </div>

                <button
                  onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3" />
                </button>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="text-right" style={{ minWidth: '80px' }}>
                <p className="font-medium">
                  ${(item.product.unitPrice * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}