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
