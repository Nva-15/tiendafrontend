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

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.isLoading = true;
    this.clientesService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.aplicarFiltros();
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

    this.clientesFiltrados = clientesFiltrados;
  }

  limpiarFiltros() {
    this.searchTerm = '';
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

  volverAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}