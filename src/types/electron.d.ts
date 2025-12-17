export {};

type CompleteSalePayload = {
  trabajadorId: number;
  metodoPago: string;
  montoRecibido: number | null;
  items: Array<{ productId: string; quantity: number }>;
};

type User = { id: number; rut: string; nombre: string };

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

  declare global {
  interface Window {
    api: {
      completeSale: (payload: CompleteSalePayload) => Promise<{
        ok: boolean;
        error?: string;
        ventaId?: number;
        total?: number;
      }>;

      login: (
        rut: string,
        pin: string
      ) => Promise<{
        ok: boolean;
        error?: string;
        user?: User;
      }>;

      getProducts: () => Promise<{
        ok: boolean;
        error?: string;
        products?: Product[];
      }>;
    };
  }
}