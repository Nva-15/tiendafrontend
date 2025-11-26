import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { VentasService } from '../../services/ventas';
import { Venta } from '../../interfaces/venta';

@Component({
  selector: 'app-lista-ventas',
  imports: [CommonModule, RouterModule],
  templateUrl: './lista-ventas.html',
  styleUrl: './lista-ventas.css'
})
export class ListaVentasComponent implements OnInit {
  private ventasService = inject(VentasService);

  ventas: Venta[] = [];
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    this.cargarVentas();
  }

  cargarVentas() {
    this.isLoading = true;
    this.ventasService.getVentas().subscribe({
      next: (ventas) => {
        this.ventas = ventas;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando ventas:', error);
        this.errorMessage = 'Error al cargar las ventas';
        this.isLoading = false;
      }
    });
  }

  cancelarVenta(id: number) {
    if (confirm('¿Está seguro de que desea cancelar esta venta?')) {
      this.ventasService.cancelarVenta(id).subscribe({
        next: () => {
          this.cargarVentas(); // Recargar la lista
        },
        error: (error) => {
          console.error('Error cancelando venta:', error);
          alert('Error al cancelar la venta');
        }
      });
    }
  }

  // Método para obtener la clase del badge
  getBadgeClass(estado: string): string {
    switch (estado) {
      case 'COMPLETADA': return 'badge bg-success';
      case 'CANCELADA': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
}