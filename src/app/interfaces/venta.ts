export interface Venta {
    id?: number;
    clienteId: number;
    usuarioId: number;
    total: number;
    fechaVenta?: string;
    estado: string;
    clienteNombre?: string;
  }