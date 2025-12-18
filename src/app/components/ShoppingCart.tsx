import { Minus, Plus, Trash2, ShoppingCart as CartIcon } from "lucide-react";
import type { CartItem } from "../App";

interface ShoppingCartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatUSDFromCents = (cents: number) =>
  usd.format((Number(cents) || 0) / 100);

export function ShoppingCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: ShoppingCartProps) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700 p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <CartIcon className="h-5 w-5 text-gray-600 dark:text-neutral-300" />
          <h2 className="text-gray-900 dark:text-neutral-100">Shopping Cart</h2>

          {itemCount > 0 && (
            <span className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full text-sm">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="px-3 py-1.5 text-sm text-gray-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart content */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-neutral-500">
            <CartIcon className="h-16 w-16 mb-3" />
            <p>The cart is empty</p>
            <p className="text-sm">Add products to start</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-3 flex items-center gap-3"
            >
              <div style={{ fontSize: "32px" }}>{item.product.image}</div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-gray-900 dark:text-neutral-100">
                  {item.product.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {item.product.id}
                </p>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  {formatUSDFromCents(item.product.unitPrice)} / each
                </p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onUpdateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Minus className="h-3 w-3 text-gray-700 dark:text-neutral-200" />
                </button>

                <div className="w-12 text-center font-medium text-gray-900 dark:text-neutral-100">
                  {item.quantity}
                </div>

                <button
                  onClick={() =>
                    onUpdateQuantity(item.product.id, item.quantity + 1)
                  }
                  disabled={item.quantity >= item.product.stock}
                  className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-3 w-3 text-gray-700 dark:text-neutral-200" />
                </button>

                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="w-8 h-8 flex items-center justify-center text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Item total */}
              <div className="text-right min-w-[90px]">
                <p className="font-medium text-gray-900 dark:text-neutral-100">
                  {formatUSDFromCents(
                    item.product.unitPrice * item.quantity
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
