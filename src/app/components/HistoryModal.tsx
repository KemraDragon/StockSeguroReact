import { useEffect, useMemo, useState } from "react";
import {
  X,
  Activity,
  ShoppingBag,
  Package,
  Calendar,
  User as UserIcon,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Box,
} from "lucide-react";

type TabKey = "movements" | "sales" | "stock";

type MovementHistoryItem = {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: "info" | "success" | "warning";
};

type SaleHistoryItem = {
  id: string;
  timestamp: string;
  cashier: string;
  items: number;
  subtotal: number; // cents
  paymentMethod: string;
  products: string[];
};

type StockHistoryItem = {
  id: string;
  timestamp: string;
  user: string;
  product: string;
  action: "Stock In" | "Stock Out" | "Adjustment";
  quantity: number; // signed (+/-)
  previousStock: number | null;
  newStock: number | null;
  reason?: string | null;
};

/**
 * ✅ Tipos mínimos para la data que viene del backend (IPC/SQLite)
 * para NO usar `any` y para poder mapear seguro.
 */
type MovementsApiRow = {
  id?: unknown;
  createdAt?: unknown;
  user?: unknown;
  action?: unknown;
  details?: unknown;
  type?: unknown;
};

type SalesApiItem = {
  name?: unknown;
  quantity?: unknown;
};

type SalesApiRow = {
  id?: unknown;
  createdAt?: unknown;
  cashier?: unknown;
  total?: unknown;
  paymentMethod?: unknown;
  items?: unknown; // puede venir array o algo raro
};

type StockApiRow = {
  id?: unknown;
  createdAt?: unknown;
  worker?: unknown;
  product?: unknown;
  operation?: unknown; // add | subtract
  quantity?: unknown;
  reason?: unknown;
};

type ApiResponse = {
  ok: boolean;
  error?: string;
  total?: unknown;
  rows?: unknown;
};

function toStringSafe(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return fallback;
}

function toNumberSafe(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toMovementType(v: unknown): MovementHistoryItem["type"] {
  return v === "success" || v === "warning" || v === "info" ? v : "info";
}

function formatUSDFromCents(cents: number) {
  const safe = Number.isFinite(cents) ? cents : 0;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    safe / 100
  );
}

function formatTimestamp(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;

  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export function HistoryModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>("movements");

  // Pagination (10 por página)
  const pageSize = 10;
  const [movPage, setMovPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [stockPage, setStockPage] = useState(1);

  // Data
  const [movementRows, setMovementRows] = useState<MovementHistoryItem[]>([]);
  const [salesRows, setSalesRows] = useState<SaleHistoryItem[]>([]);
  const [stockRows, setStockRows] = useState<StockHistoryItem[]>([]);

  // Totals
  const [movTotal, setMovTotal] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [stockTotal, setStockTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabBtnBase =
    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all";
  const tabBtnActive =
    "bg-gradient-to-r from-purple-600 to-green-600 text-white border-transparent shadow-lg";
  const tabBtnIdle = "bg-background hover:bg-muted border-border text-foreground";

  const badgeByType: Record<MovementHistoryItem["type"], string> = {
    info: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
    success: "bg-green-500/15 text-green-300 border border-green-500/20",
    warning: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
  };

  const stockBadge: Record<StockHistoryItem["action"], string> = {
    "Stock In": "bg-green-500/15 text-green-300 border border-green-500/20",
    "Stock Out": "bg-red-500/15 text-red-300 border border-red-500/20",
    Adjustment: "bg-orange-500/15 text-orange-300 border border-orange-500/20",
  };

  // Cargar datos reales desde DB (por tab + página)
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        if (tab === "movements") {
          const res = (await window.api.getMovementsHistory({
            page: movPage,
            pageSize,
          })) as ApiResponse;

          if (!mounted) return;

          if (!res.ok) {
            throw new Error(res.error ?? "Error loading movements history.");
          }

          const rawRows = Array.isArray(res.rows) ? (res.rows as unknown[]) : [];

          const rows: MovementHistoryItem[] = rawRows.map((rowUnknown) => {
            const r = rowUnknown as MovementsApiRow;

            return {
              id: toStringSafe(r.id),
              timestamp: formatTimestamp(toStringSafe(r.createdAt)),
              user: toStringSafe(r.user, "Unknown"),
              action: toStringSafe(r.action, "Movement"),
              details: toStringSafe(r.details, ""),
              type: toMovementType(r.type),
            };
          });

          setMovementRows(rows);
          setMovTotal(toNumberSafe(res.total, 0));
        }

        if (tab === "sales") {
          const res = (await window.api.getSalesHistory({
            page: salesPage,
            pageSize,
          })) as ApiResponse;

          if (!mounted) return;

          if (!res.ok) {
            throw new Error(res.error ?? "Error loading sales history.");
          }

          const rawRows = Array.isArray(res.rows) ? (res.rows as unknown[]) : [];

          const rows: SaleHistoryItem[] = rawRows.map((rowUnknown) => {
            const s = rowUnknown as SalesApiRow;

            const rawItems: SalesApiItem[] = Array.isArray(s.items)
              ? (s.items as SalesApiItem[])
              : [];

            const itemsCount = rawItems.reduce(
              (acc, it) => acc + toNumberSafe(it.quantity, 0),
              0
            );

            const productsList = rawItems.map((it) => {
              const name = toStringSafe(it.name, "Product");
              const qty = toNumberSafe(it.quantity, 0);
              return `${name} x${qty}`;
            });

            return {
              id: `SALE-${toNumberSafe(s.id, 0)}`,
              timestamp: formatTimestamp(toStringSafe(s.createdAt)),
              cashier: toStringSafe(s.cashier, "Unknown"),
              items: itemsCount,
              subtotal: toNumberSafe(s.total, 0),
              paymentMethod: toStringSafe(s.paymentMethod, "Cash"),
              products: productsList,
            };
          });

          setSalesRows(rows);
          setSalesTotal(toNumberSafe(res.total, 0));
        }

        if (tab === "stock") {
          const res = (await window.api.getStockHistory({
            page: stockPage,
            pageSize,
          })) as ApiResponse;

          if (!mounted) return;

          if (!res.ok) {
            throw new Error(res.error ?? "Error loading stock history.");
          }

          const rawRows = Array.isArray(res.rows) ? (res.rows as unknown[]) : [];

          const rows: StockHistoryItem[] = rawRows.map((rowUnknown) => {
            const r = rowUnknown as StockApiRow;

            const operation = toStringSafe(r.operation);
            const qty = toNumberSafe(r.quantity, 0);
            const reason = (typeof r.reason === "string" ? r.reason : null) as string | null;

            const isSaleOut =
              operation === "subtract" && typeof reason === "string" && reason.startsWith("sale:");

            const action: StockHistoryItem["action"] =
              operation === "add" ? "Stock In" : isSaleOut ? "Stock Out" : "Adjustment";

            return {
              id: `STK-${toNumberSafe(r.id, 0)}`,
              timestamp: formatTimestamp(toStringSafe(r.createdAt)),
              user: toStringSafe(r.worker, "Unknown"),
              product: toStringSafe(r.product, "Unknown"),
              action,
              quantity: operation === "add" ? Math.abs(qty) : -Math.abs(qty),
              previousStock: null,
              newStock: null,
              reason,
            };
          });

          setStockRows(rows);
          setStockTotal(toNumberSafe(res.total, 0));
        }
      } catch (e: unknown) {
        if (!mounted) return;
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tab, movPage, salesPage, stockPage]);

  // Summary de ventas (basado en la página actual)
  const salesSummary = useMemo(() => {
    const total = salesRows.reduce((acc, s) => acc + s.subtotal, 0);
    const transactions = salesRows.length;
    const items = salesRows.reduce((acc, s) => acc + s.items, 0);
    return { total, transactions, items };
  }, [salesRows]);

  const currentPage = tab === "movements" ? movPage : tab === "sales" ? salesPage : stockPage;
  const currentTotal = tab === "movements" ? movTotal : tab === "sales" ? salesTotal : stockTotal;
  const totalPages = Math.max(1, Math.ceil(currentTotal / pageSize));

  const goPrev = () => {
    if (currentPage <= 1) return;
    if (tab === "movements") setMovPage((p) => p - 1);
    if (tab === "sales") setSalesPage((p) => p - 1);
    if (tab === "stock") setStockPage((p) => p - 1);
  };

  const goNext = () => {
    if (currentPage >= totalPages) return;
    if (tab === "movements") setMovPage((p) => p + 1);
    if (tab === "sales") setSalesPage((p) => p + 1);
    if (tab === "stock") setStockPage((p) => p + 1);
  };

  // Reset de página al cambiar tab (UX)
  const switchTab = (next: TabKey) => {
    setTab(next);
    if (next === "movements") setMovPage(1);
    if (next === "sales") setSalesPage(1);
    if (next === "stock") setStockPage(1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-purple-600/20 to-green-600/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Activity History</h2>
              <p className="text-sm text-muted-foreground">
                Admin-only overview of movements, sales and stock activity
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted border border-border"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={`${tabBtnBase} ${tab === "movements" ? tabBtnActive : tabBtnIdle}`}
              onClick={() => switchTab("movements")}
            >
              <Activity className="h-4 w-4" />
              Movement History
            </button>

            <button
              className={`${tabBtnBase} ${tab === "sales" ? tabBtnActive : tabBtnIdle}`}
              onClick={() => switchTab("sales")}
            >
              <ShoppingBag className="h-4 w-4" />
              Sales History
            </button>

            <button
              className={`${tabBtnBase} ${tab === "stock" ? tabBtnActive : tabBtnIdle}`}
              onClick={() => switchTab("stock")}
            >
              <Package className="h-4 w-4" />
              Stock History
            </button>
          </div>

          {/* Status line */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {loading ? "Loading..." : error ? `⚠️ ${error}` : `${currentTotal} records`}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={goNext}
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1 rounded-md border border-border bg-background hover:bg-muted disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-auto">
          {tab === "movements" ? (
            <div className="space-y-3">
              {movementRows.length === 0 && !loading && !error ? (
                <div className="text-sm text-muted-foreground">No movements found.</div>
              ) : null}

              {movementRows.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-background"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-muted">
                      <Box className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{m.action}</span>
                        <span className={`text-xs px-2 py-1 rounded-md ${badgeByType[m.type]}`}>
                          {m.type.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{m.details}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {m.timestamp}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="h-3.5 w-3.5" />
                          {m.user}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.id}</span>
                </div>
              ))}
            </div>
          ) : null}

          {tab === "sales" ? (
            <div className="space-y-6">
              {/* Summary (de la página actual) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <DollarSign className="h-4 w-4" />
                    Total (this page)
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {formatUSDFromCents(salesSummary.total)}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <TrendingUp className="h-4 w-4" />
                    Transactions
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{salesSummary.transactions}</div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <ShoppingBag className="h-4 w-4" />
                    Items Sold
                  </div>
                  <div className="mt-1 text-2xl font-semibold">{salesSummary.items}</div>
                </div>
              </div>

              {/* Sales list */}
              <div className="space-y-3">
                {salesRows.length === 0 && !loading && !error ? (
                  <div className="text-sm text-muted-foreground">No sales found.</div>
                ) : null}

                {salesRows.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-border bg-background">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.id}</span>
                        <span className="text-xs text-muted-foreground">{s.timestamp}</span>
                      </div>

                      <div className="text-sm">
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-semibold">{formatUSDFromCents(s.subtotal)}</span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {s.cashier}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ShoppingBag className="h-4 w-4" />
                        {s.items} items
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {String(s.paymentMethod).toLowerCase().includes("cash") ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {s.paymentMethod}
                      </span>
                    </div>

                    <div className="mt-3 text-sm">
                      <div className="font-medium mb-1">Products</div>
                      {s.products.length === 0 ? (
                        <div className="text-muted-foreground">No items.</div>
                      ) : (
                        <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                          {s.products.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "stock" ? (
            <div className="space-y-3">
              {stockRows.length === 0 && !loading && !error ? (
                <div className="text-sm text-muted-foreground">No stock movements found.</div>
              ) : null}

              {stockRows.map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-border bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.product}</span>
                      <span className={`text-xs px-2 py-1 rounded-md ${stockBadge[s.action]}`}>
                        {s.action}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{s.id}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {s.timestamp}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {s.user}
                    </span>
                    {s.reason ? (
                      <span className="inline-flex items-center gap-1">
                        <Box className="h-4 w-4" />
                        {s.reason}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="text-xs text-muted-foreground">Quantity</div>
                      <div className="text-lg font-semibold">
                        {s.quantity > 0 ? `+${s.quantity}` : s.quantity}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="text-xs text-muted-foreground">Previous Stock</div>
                      <div className="text-lg font-semibold">{s.previousStock ?? "—"}</div>
                    </div>

                    <div className="p-3 rounded-lg border border-border bg-muted/30">
                      <div className="text-xs text-muted-foreground">New Stock</div>
                      <div className="text-lg font-semibold">{s.newStock ?? "—"}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Note: Previous/New stock requires saving those values in the DB at movement time.
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {currentTotal === 0 ? (
              "Showing 0–0 of 0"
            ) : (
              <>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, currentTotal)} of {currentTotal}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={currentPage <= 1 || loading}
              className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={goNext}
              disabled={currentPage >= totalPages || loading}
              className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm disabled:opacity-50"
            >
              Next
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
