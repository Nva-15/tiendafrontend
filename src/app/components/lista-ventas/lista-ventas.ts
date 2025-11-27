import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { VentasService } from '../../services/ventas';
import { Venta } from '../../interfaces/venta';

declare var bootstrap: any;

@Component({
  selector: 'app-lista-ventas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-ventas.html',
  styleUrl: './lista-ventas.css'
})
export class ListaVentasComponent implements OnInit {
  private ventasService = inject(VentasService);
  private router = inject(Router);

  @ViewChild('detalleVentaModal') detalleVentaModal!: ElementRef;

  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  isLoading = false;
  errorMessage = '';

  ventaSeleccionada: Venta | null = null;

  // Filtros
  searchTerm = '';
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  filtroEstado = 'TODOS';
  filtroMetodoPago = 'TODOS';

  // Estadísticas
  ventasCompletadas = 0;
  ventasCanceladas = 0;

  // Opciones de filtros
  opcionesEstado = [
    { valor: 'TODOS', texto: 'Todos los estados' },
    { valor: 'COMPLETADA', texto: 'Completadas' },
    { valor: 'CANCELADA', texto: 'Canceladas' },
    { valor: 'PENDIENTE', texto: 'Pendientes' }
  ];

  opcionesMetodoPago = [
    { valor: 'TODOS', texto: 'Todos los métodos' },
    { valor: 'EFECTIVO', texto: 'Efectivo' },
    { valor: 'TARJETA', texto: 'Tarjeta' },
    { valor: 'PLIN', texto: 'Plin' },
    { valor: 'YAPE', texto: 'Yape' },
    { valor: 'TRANSFERENCIA', texto: 'Transferencia' }
  ];

  ngOnInit() {
    this.establecerRangoFechasPorDefecto();
    this.cargarVentas();
  }

  establecerRangoFechasPorDefecto() {
    const fechaHasta = new Date();
    const fechaDesde = new Date();
    fechaDesde.setDate(fechaHasta.getDate() - 7); // Últimos 7 días
    
    this.filtroFechaHasta = this.formatearFecha(fechaHasta);
    this.filtroFechaDesde = this.formatearFecha(fechaDesde);
  }

  formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  cargarVentas() {
    this.isLoading = true;
    this.ventasService.getVentas().subscribe({
      next: (ventas) => {
        console.log('Ventas cargadas:', ventas); // DEBUG
        // Ordenar ventas por ID de forma descendente (más recientes primero)
        this.ventas = ventas.sort((a, b) => (b.id || 0) - (a.id || 0));
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando ventas:', error);
        this.errorMessage = 'Error al cargar las ventas: ' + error.message;
        this.isLoading = false;
      }
    });
  }

  validarFechas(): boolean {
    if (this.filtroFechaDesde && this.filtroFechaHasta) {
      const fechaDesde = new Date(this.filtroFechaDesde);
      const fechaHasta = new Date(this.filtroFechaHasta);
      
      if (fechaHasta < fechaDesde) {
        alert('La fecha "Hasta" no puede ser menor que la fecha "Desde"');
        this.filtroFechaHasta = this.filtroFechaDesde;
        return false;
      }
    }
    return true;
  }

  aplicarFiltros() {
    if (!this.validarFechas()) {
      return;
    }

    let ventasFiltradas = this.ventas;

    // Filtro por búsqueda general
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      ventasFiltradas = ventasFiltradas.filter(venta =>
        venta.id?.toString().includes(term) ||
        venta.clienteId?.toString().includes(term) ||
        venta.cliente?.nombre?.toLowerCase().includes(term) ||
        venta.cliente?.dni?.includes(term) ||
        venta.usuario?.nombre?.toLowerCase().includes(term) ||
        venta.usuario?.nombreUsuario?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'TODOS') {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        venta.estado === this.filtroEstado
      );
    }

    // Filtro por método de pago
    if (this.filtroMetodoPago !== 'TODOS') {
      ventasFiltradas = ventasFiltradas.filter(venta => 
        venta.tipoPago?.toUpperCase() === this.filtroMetodoPago
      );
    }

    // Filtro por fecha desde 
    if (this.filtroFechaDesde) {
      const fechaDesde = new Date(this.filtroFechaDesde);
      const fechaDesdeUTC = new Date(fechaDesde);
      fechaDesdeUTC.setUTCHours(5, 0, 0, 0);
      
      ventasFiltradas = ventasFiltradas.filter(venta => {
        if (!venta.fecha) return false;
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta >= fechaDesdeUTC;
      });
    }

    // Filtro por fecha hasta 
    if (this.filtroFechaHasta) {
      const fechaHasta = new Date(this.filtroFechaHasta);
      const fechaHastaUTC = new Date(fechaHasta);
      fechaHastaUTC.setUTCDate(fechaHastaUTC.getUTCDate() + 1);
      fechaHastaUTC.setUTCHours(4, 59, 59, 999);
      
      ventasFiltradas = ventasFiltradas.filter(venta => {
        if (!venta.fecha) return false;
        const fechaVenta = new Date(venta.fecha);
        return fechaVenta <= fechaHastaUTC;
      });
    }

    this.ventasFiltradas = ventasFiltradas;
    this.calcularEstadisticas();
  }

  onFechaDesdeChange() {
    if (this.filtroFechaDesde && this.filtroFechaHasta) {
      const fechaDesde = new Date(this.filtroFechaDesde);
      const fechaHasta = new Date(this.filtroFechaHasta);
      
      if (fechaHasta < fechaDesde) {
        this.filtroFechaHasta = this.filtroFechaDesde;
      }
    }
    this.aplicarFiltros();
  }

  onFechaHastaChange() {
    if (this.filtroFechaDesde && this.filtroFechaHasta) {
      const fechaDesde = new Date(this.filtroFechaDesde);
      const fechaHasta = new Date(this.filtroFechaHasta);
      
      if (fechaHasta < fechaDesde) {
        alert('La fecha "Hasta" no puede ser menor que la fecha "Desde"');
        this.filtroFechaHasta = this.filtroFechaDesde;
        return;
      }
    }
    this.aplicarFiltros();
  }

  calcularEstadisticas() {
    this.ventasCompletadas = this.ventasFiltradas.filter(v => v.estado === 'COMPLETADA').length;
    this.ventasCanceladas = this.ventasFiltradas.filter(v => v.estado === 'CANCELADA').length;
  }

  limpiarFiltros() {
    this.searchTerm = '';
    this.establecerRangoFechasPorDefecto();
    this.filtroEstado = 'TODOS';
    this.filtroMetodoPago = 'TODOS';
    this.aplicarFiltros();
  }

  verDetalle(venta: Venta) {
    console.log('Venta seleccionada:', venta); // DEBUG
    this.ventaSeleccionada = venta;
    const modalElement = this.detalleVentaModal.nativeElement;
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
  }

  cancelarDesdeModal() {
    if (this.ventaSeleccionada?.id) {
      this.cancelarVenta(this.ventaSeleccionada.id);
    }
  }

  cancelarVenta(id: number) {
    if (confirm('¿Está seguro de que desea cancelar esta venta?')) {
      this.ventasService.cancelarVenta(id).subscribe({
        next: () => {
          this.cargarVentas();
          const modalElement = this.detalleVentaModal.nativeElement;
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          }
        },
        error: (error) => {
          console.error('Error cancelando venta:', error);
          alert('Error al cancelar la venta: ' + error.message);
        }
      });
    }
  }

  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'COMPLETADA': return 'badge bg-success';
      case 'CANCELADA': return 'badge bg-danger';
      case 'PENDIENTE': return 'badge bg-warning text-dark';
      default: return 'badge bg-secondary';
    }
  }

  getPagoBadgeClass(tipoPago: string): string {
    const pago = tipoPago?.toUpperCase();
    switch (pago) {
      case 'EFECTIVO': return 'bg-warning text-dark';
      case 'TARJETA': return 'bg-primary text-white';
      case 'PLIN': return 'bg-success text-white';
      case 'YAPE': return 'bg-purple text-white';
      case 'TRANSFERENCIA': return 'bg-info text-dark';
      default: return 'bg-secondary text-white';
    }
  }

  calcularTotalGeneral(): number {
    return this.ventasFiltradas.reduce((total, venta) => {
      return total + (venta.total || 0);
    }, 0);
  }

  volverAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}