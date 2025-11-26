import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClientesService } from '../../services/clientes';
import { Cliente } from '../../interfaces/cliente';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-clientes.html',
  styleUrls: ['./lista-clientes.css']
})
export class ListaClientesComponent implements OnInit {
  private clientesService = inject(ClientesService);
  private router = inject(Router);

  clientes: Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  isLoading = true;
  errorMessage = '';

  // Filtros
  searchTerm = '';
  filtroEstado = 'TODOS';

  // Estadísticas
  clientesActivos = 0;
  clientesInactivos = 0;

  // Opciones de filtros
  opcionesEstado = [
    { valor: 'TODOS', texto: 'Todos los estados' },
    { valor: 'ACTIVO', texto: 'Activos' },
    { valor: 'INACTIVO', texto: 'Inactivos' }
  ];

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.isLoading = true;
    this.clientesService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
        this.errorMessage = 'Error al cargar los clientes';
        this.isLoading = false;
      }
    });
  }

  aplicarFiltros() {
    let clientesFiltrados = this.clientes;

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      clientesFiltrados = clientesFiltrados.filter(cliente =>
        cliente.nombre.toLowerCase().includes(term) ||
        cliente.dni.includes(term) ||
        (cliente.correo && cliente.correo.toLowerCase().includes(term)) ||
        (cliente.telefono && cliente.telefono.includes(term))
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'TODOS') {
      clientesFiltrados = clientesFiltrados.filter(cliente => 
        cliente.estado === this.filtroEstado
      );
    }

    this.clientesFiltrados = clientesFiltrados;
    this.calcularEstadisticas();
  }

  calcularEstadisticas() {
    this.clientesActivos = this.clientesFiltrados.filter(c => c.estado === 'ACTIVO').length;
    this.clientesInactivos = this.clientesFiltrados.filter(c => c.estado === 'INACTIVO').length;
  }

  limpiarFiltros() {
    this.searchTerm = '';
    this.filtroEstado = 'TODOS';
    this.aplicarFiltros();
  }

  editarCliente(id?: number) {
    if (id) {
      this.router.navigate(['/clientes/editar', id]);
    }
  }

  eliminarCliente(id?: number) {
    if (id && confirm('¿Estás seguro de eliminar este cliente?')) {
      this.clientesService.deleteCliente(id).subscribe({
        next: () => {
          this.cargarClientes();
        },
        error: (error) => {
          console.error('Error eliminando cliente:', error);
          alert('Error al eliminar el cliente');
        }
      });
    }
  }

  cambiarEstado(cliente: Cliente) {
    const nuevoEstado = cliente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const clienteActualizado = { ...cliente, estado: nuevoEstado };
    
    if (cliente.id) {
      this.clientesService.updateCliente(cliente.id, clienteActualizado).subscribe({
        next: () => {
          this.cargarClientes();
        },
        error: (error) => {
          console.error('Error actualizando cliente:', error);
        }
      });
    }
  }

  getEstadoBadge(estado: string = 'ACTIVO'): string {
    return estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary';
  }

  volverAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}