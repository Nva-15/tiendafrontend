import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuarios';
import { UsuarioForm, UsuarioResponse } from '../../interfaces/usuario';


@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-usuarios.html',
  styleUrls: ['./lista-usuarios.css']
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: UsuarioResponse[] = [];
  usuariosFiltrados: UsuarioResponse[] = [];
  filtroEstado: string = 'TODOS';
  filtroRol: string = 'TODOS';
  loading: boolean = false;
  error: string = '';

  estados = ['TODOS', 'ACTIVO', 'INACTIVO'];
  roles = ['TODOS', 'ADMIN', 'USER'];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los usuarios';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  aplicarFiltros(): void {
    this.usuariosFiltrados = this.usuarios.filter(usuario => {
      const cumpleEstado = this.filtroEstado === 'TODOS' || usuario.estado === this.filtroEstado;
      const cumpleRol = this.filtroRol === 'TODOS' || usuario.rol === this.filtroRol;
      return cumpleEstado && cumpleRol;
    });
  }

  onFiltroChange(): void {
    this.aplicarFiltros();
  }

  eliminarUsuario(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      this.usuarioService.deleteUsuario(id).subscribe({
        next: () => {
          this.cargarUsuarios();
        },
        error: (error) => {
          this.error = 'Error al eliminar el usuario';
          console.error('Error:', error);
        }
      });
    }
  }

  cambiarEstadoUsuario(usuario: UsuarioResponse): void {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const usuarioActualizado: UsuarioForm = { 
      nombre: usuario.nombre,
      nombreUsuario: usuario.nombreUsuario,
      rol: usuario.rol,
      estado: nuevoEstado
    };
    
    this.usuarioService.updateUsuario(usuario.id, usuarioActualizado).subscribe({
      next: () => {
        this.cargarUsuarios();
      },
      error: (error) => {
        this.error = 'Error al cambiar el estado del usuario';
        console.error('Error:', error);
      }
    });
  }

  getEstadoBadgeClass(estado: string): string {
    return estado === 'ACTIVO' ? 'badge-activo' : 'badge-inactivo';
  }

  getRolBadgeClass(rol: string): string {
    return rol === 'ADMIN' ? 'badge-admin' : 'badge-user';
  }
}