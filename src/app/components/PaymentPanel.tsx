import { useMemo, useState } from "react";
import { CreditCard, Banknote, DollarSign, Printer, X } from "lucide-react";

interface PaymentPanelProps {
  subtotalCents: number; // 👈 subtotal en CENTAVOS
  onCompleteSale: (paymentMethod: string, receivedAmountCents?: number) => void; // 👈 recibido en CENTAVOS
  hasItems: boolean;
}

// NYC Sales Tax (típico): 8.875%
const TAX_RATE = 0.08875;

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatUSDFromCents(cents: number) {
  return usd.format((cents || 0) / 100);
}

export function PaymentPanel({
  subtotalCents,
  onCompleteSale,
  hasItems,
}: PaymentPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<
    "efectivo" | "tarjeta" | "transferencia"
  >("efectivo");

  // input en dólares (ej: "10.00")
  const [receivedAmount, setReceivedAmount] = useState<string>("");

  // ✅ Tax en centavos sin “doble redondeo”
  const taxCents = useMemo(() => Math.round(subtotalCents * TAX_RATE), [subtotalCents]);
  const totalWithTaxCents = useMemo(
    () => subtotalCents + taxCents,
    [subtotalCents, taxCents]
  );

  // ✅ recibido en centavos
  const receivedCents = useMemo(() => {
    const n = parseFloat(receivedAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 100);
  }, [receivedAmount]);

  const changeCents = useMemo(
    () => receivedCents - totalWithTaxCents,
    [receivedCents, totalWithTaxCents]
  );

  const handleCompleteSale = () => {
    if (!hasItems) return;

    if (paymentMethod === "efectivo" && receivedCents < totalWithTaxCents) {
      alert("The received amount is less than the total (with tax).");
      return;
    }

    onCompleteSale(
      paymentMethod,
      paymentMethod === "efectivo" ? receivedCents : undefined
    );

    setReceivedAmount("");
  };

  // Montos rápidos (USD) -> se setean como string en dólares
  const quickAmounts = [5, 10, 20, 50, 100];

  return (
    <div className="flex flex-col h-full text-foreground">
      <h2 className="mb-4">Payment Panel</h2>

      {/* Totals Section */}
      <div className="rounded-lg p-4 mb-6 space-y-2 bg-muted">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatUSDFromCents(subtotalCents)}</span>
        </div>

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Tax (8.875%)</span>
          <span>{formatUSDFromCents(taxCents)}</span>
        </div>

        <div className="flex justify-between text-lg font-bold text-green-600 border-t border-border pt-2">
          <span>Total</span>
          <span>{formatUSDFromCents(totalWithTaxCents)}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="mb-3 block font-medium">Payment Method</label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setPaymentMethod("efectivo")}
            className={`flex items-center justify-start px-4 py-3 rounded-lg transition-colors ${
              paymentMethod === "efectivo"
                ? "bg-green-600 text-white"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            <Banknote className="h-4 w-4 mr-2" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => setPaymentMethod("tarjeta")}
            className={`flex items-center justify-start px-4 py-3 rounded-lg transition-colors ${
              paymentMethod === "tarjeta"
                ? "bg-green-600 text-white"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            <span>Debit/Credit Card</span>
          </button>

          <button
            onClick={() => setPaymentMethod("transferencia")}
            className={`flex items-center justify-start px-4 py-3 rounded-lg transition-colors ${
              paymentMethod === "transferencia"
                ? "bg-green-600 text-white"
                : "bg-card border border-border text-foreground hover:bg-muted"
            }`}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            <span>Transfer</span>
          </button>
        </div>
      </div>

      {/* Cash Payment Details */}
      {paymentMethod === "efectivo" && (
        <div className="mb-6">
          <label htmlFor="received" className="mb-2 block font-medium">
            Amount Received
          </label>

          <input
            id="received"
            type="number"
            placeholder="0.00"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg focus:border-green-500 focus:outline-none mb-3 bg-muted border border-border text-foreground placeholder:text-muted-foreground"
            style={{ fontSize: "16px" }}
          />

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setReceivedAmount(amount.toFixed(2))}
                className="px-2 py-2 text-xs border border-border bg-card rounded-lg hover:bg-muted transition-colors text-foreground"
              >
                {usd.format(amount)}
              </button>
            ))}

            <button
              onClick={() => setReceivedAmount((totalWithTaxCents / 100).toFixed(2))}
              className="px-2 py-2 text-xs border border-border bg-card rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              Exact
            </button>
          </div>

          {/* Change Display */}
          {receivedAmount && (
            <div
              className={`rounded-lg p-3 ${
                changeCents >= 0 ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"
              }`}
            >
              <p className="text-sm text-muted-foreground mb-1">Change</p>
              <p
                className={`text-xl font-bold ${
                  changeCents >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {changeCents >= 0
                  ? formatUSDFromCents(changeCents)
                  : "Insufficient"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <button
          onClick={handleCompleteSale}
          disabled={
            !hasItems || (paymentMethod === "efectivo" && receivedCents < totalWithTaxCents)
          }
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          style={{ minHeight: "48px" }}
        >
          <CreditCard className="h-5 w-5" />
          <span>Complete Sale</span>
        </button>

        <button
          className="w-full px-6 py-3 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!hasItems}
          style={{ minHeight: "48px" }}
        >
          <Printer className="h-5 w-5" />
          <span>Print Quote</span>
        </button>

        <button
          className="w-full px-6 py-3 bg-card border border-border text-muted-foreground rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2"
          style={{ minHeight: "48px" }}
        >
          <X className="h-5 w-5" />
          <span>Cancel Sale</span>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Press F2 for quick checkout
        </p>
      </div>
    </div>
  );
}
