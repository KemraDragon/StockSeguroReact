export { };

declare global {
  type SimpleOk = { ok: boolean; error?: string };

  type User = {
    id: number;
    nombre: string;
    email?: string;
    rut?: string; // compatibilidad legacy
  };

  type Product = {
    id: string;
    barcode: string;
    name: string;
    category: string;
    unitPrice: number;
    boxPrice: number;
    stock: number;
    minStock: number;
    image: string;
  };

  type ProductsListResponse = { ok: boolean; error?: string; products?: Product[] };

  type LoginResponse = { ok: boolean; error?: string; user?: User };

  type CompleteSalePayload = {
    trabajadorId: number;
    metodoPago: string;
    montoRecibido: number | null;
    items: Array<{ productId: string; quantity: number }>;
  };

  type CompleteSaleResponse = { ok: boolean; error?: string; ventaId?: number; total?: number };

  type CreateOrUpdateProductPayload = {
    id: string;
    barcode: string;
    name: string;
    category: string;
    unitPrice: number;
    boxPrice: number;
    stock: number;
    minStock: number;
    image: string;
  };

  interface Window {
    api: {
      login: (email: string, password: string) => Promise<LoginResponse>;
      getProducts: () => Promise<ProductsListResponse>;
      completeSale: (payload: CompleteSalePayload) => Promise<CompleteSaleResponse>;

      createProduct: (payload: CreateOrUpdateProductPayload) => Promise<SimpleOk>;
      updateProduct: (payload: CreateOrUpdateProductPayload) => Promise<SimpleOk>;
      deleteProduct: (productId: string) => Promise<SimpleOk>;
      getSalesHistory: (params: { page?: number; pageSize?: number }) => Promise<{
        
  ok: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
  rows: Array<{
    id: number;
    total: number;
    paymentMethod: string;
    receivedAmount: number | null;
    createdAt: string;
    cashier: string;
    cashierEmail: string | null;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }>;
  }>;
}>;

getStockHistory: (params: { page?: number; pageSize?: number }) => Promise<{
  ok: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
  rows: Array<{
    id: number;
    productId: string;
    product: string;
    workerId: number;
    worker: string;
    workerEmail: string | null;
    operation: "add" | "subtract" | string;
    quantity: number;
    reason: string | null;
    createdAt: string;
  }>;
}>;

getMovementsHistory: (params: { page?: number; pageSize?: number }) => Promise<{
  ok: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number;
  rows: Array<{
    id: string;
    createdAt: string;
    user: string;
    action: string;
    details: string;
    type: "info" | "success" | "warning" | string;
  }>;
}>;

      adjustStock: (payload: {
        workerId: number;
        productId: string;
        operation: "add" | "subtract";
        quantity: number;
        reason?: string;
      }) => Promise<{
        ok: boolean;
        error?: string;
      }>;
    };
  }
}
