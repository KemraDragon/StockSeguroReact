import { useState } from 'react';
import { CreditCard, Banknote, DollarSign, Printer, X } from 'lucide-react';

interface PaymentPanelProps {
  total: number;
  onCompleteSale: (paymentMethod: string, receivedAmount?: number) => void;
  hasItems: boolean;
}

export function PaymentPanel({ total, onCompleteSale, hasItems }: PaymentPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  
  const received = parseFloat(receivedAmount) || 0;
  const change = received - total;

  const handleCompleteSale = () => {
    if (!hasItems) return;
    
    if (paymentMethod === 'efectivo' && received < total) {
      alert('El monto recibido es menor al total');
      return;
    }

    onCompleteSale(paymentMethod, paymentMethod === 'efectivo' ? received : undefined);
    setReceivedAmount('');
  };

  const quickAmounts = [5000, 10000, 20000, 50000, 100000];

  return (
    <div className="flex flex-col h-full">
      <h2 className="mb-4">Panel de Pago</h2>

      {/* Total Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
        <p className="text-green-600" style={{ fontSize: '32px', fontWeight: 700 }}>
          ${total.toLocaleString()}
        </p>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="mb-3 block font-medium">Método de Pago</label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setPaymentMethod('efectivo')}
            className={`flex items-center justify-start px-4 py-3 rounded-lg transition-colors ${
              paymentMethod === 'efectivo' 
                ? 'bg-green-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Banknote className="h-4 w-4 mr-2" />
            <span>Efectivo</span>
          </button>
          <button
            onClick={() => setPaymentMethod('tarjeta')}
            className={`flex items-center justify-start px-4 py-3 rounded-lg transition-colors ${
              paymentMethod === 'tarjeta' 
                ? 'bg-green-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            <span>Tarjeta Débito/Crédito</span>
          </button>
          <button
            onClick={() => setPaymentMethod('transferencia')}
            className={`flex items-center justify-start px-4 py-3 rounded-lg transition-colors ${
              paymentMethod === 'transferencia' 
                ? 'bg-green-600 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            <span>Transferencia</span>
          </button>
        </div>
      </div>

      {/* Cash Payment Details */}
      {paymentMethod === 'efectivo' && (
        <div className="mb-6">
          <label htmlFor="received" className="mb-2 block font-medium">
            Monto Recibido
          </label>
          <input
            id="received"
            type="number"
            placeholder="0"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none mb-3"
            style={{ fontSize: '16px' }}
          />

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => setReceivedAmount(amount.toString())}
                className="px-2 py-2 text-xs border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
              >
                ${(amount / 1000).toFixed(0)}k
              </button>
            ))}
            <button
              onClick={() => setReceivedAmount(total.toString())}
              className="px-2 py-2 text-xs border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              Exacto
            </button>
          </div>

          {/* Change Display */}
          {receivedAmount && (
            <div className={`rounded-lg p-3 ${change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className="text-sm text-gray-600 mb-1">Cambio</p>
              <p className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${change >= 0 ? change.toLocaleString() : 'Insuficiente'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <button
          onClick={handleCompleteSale}
          disabled={!hasItems || (paymentMethod === 'efectivo' && received < total)}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          style={{ minHeight: '48px' }}
        >
          <CreditCard className="h-5 w-5" />
          <span>Completar Venta</span>
        </button>

        <button
          className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasItems}
          style={{ minHeight: '48px' }}
        >
          <Printer className="h-5 w-5" />
          <span>Imprimir Cotización</span>
        </button>

        <button
          className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          style={{ minHeight: '48px' }}
        >
          <X className="h-5 w-5" />
          <span>Cancelar Venta</span>
        </button>
      </div>

      {/* Info Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Presione F2 para finalizar venta rápida
        </p>
      </div>
    </div>
  );
}