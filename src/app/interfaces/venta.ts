// interfaces/venta.ts
export interface Venta {
  id?: number;
  fecha?: string;
  total: number;
  clienteId: number;
  usuarioId: number;
  estado: string;
  tipoPago: string;
  detalles: DetalleVenta[];
  cliente?: Cliente; 
  usuario?: Usuario; 
}

export interface DetalleVenta {
  id?: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  productoId: number;
  ventaId?: number;
  producto?: Producto;
}

export interface VentaRequest {
  clienteId: number;
  usuarioId: number;
  tipoPago: string;
  detalles: DetalleVentaRequest[];
}

export interface DetalleVentaRequest {
  productoId: number;
  cantidad: number;
  precioUnitario?: number;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  precioCompra: number;
  precioVenta: number;
  unidad: string;
  estado: string;
  categoriaId: number;
  stockMinimo: number;
  categoriaNombre?: string;
}

export interface Cliente {
  id?: number; 
  nombre: string;
  dni: string;
  correo?: string;
  telefono?: string;
  direccion?: string;
  fechaRegistro?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  nombreUsuario: string;
  rol: string;
  estado: string;
}