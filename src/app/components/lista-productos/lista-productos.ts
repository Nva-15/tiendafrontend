import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductosService } from '../../services/productos';
import { CategoriasService } from '../../services/categorias';
import { Producto } from '../../interfaces/producto';
import { Categoria } from '../../interfaces/categoria';

@Component({
  selector: 'app-lista-productos',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lista-productos.html',
  styleUrl: './lista-productos.css'
})
export class ListaProductosComponent implements OnInit {
  private productosService = inject(ProductosService);
  private categoriasService = inject(CategoriasService);
  private router = inject(Router);

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: Categoria[] = [];
  isLoading = true;
  isLoadingCategorias = true;

  // Filtros
  searchTerm = '';
  filtroEstado = 'TODOS';
  filtroStock = 'TODOS';
  filtroCategoria = 'TODAS';

  // Estadísticas
  productosActivos = 0;
  productosStockBajo = 0;
  productosSinStock = 0;

  // Opciones de filtros
  opcionesEstado = [
    { valor: 'TODOS', texto: 'Todos los estados' },
    { valor: 'ACTIVO', texto: 'Activos' },
    { valor: 'INACTIVO', texto: 'Inactivos' }
  ];

  opcionesStock = [
    { valor: 'TODOS', texto: 'Todo el stock' },
    { valor: 'STOCK_BAJO', texto: 'Stock bajo' },
    { valor: 'SIN_STOCK', texto: 'Sin stock' },
    { valor: 'STOCK_NORMAL', texto: 'Stock normal' }
  ];

  ngOnInit() {
    this.cargarProductos();
    this.cargarCategorias();
  }

  cargarProductos() {
    this.isLoading = true;
    this.productosService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.isLoading = false;
      }
    });
  }

  cargarCategorias() {
    this.isLoadingCategorias = true;
    this.categoriasService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        this.isLoadingCategorias = false;
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.isLoadingCategorias = false;
      }
    });
  }

  aplicarFiltros() {
    let productosFiltrados = this.productos;

    // Filtro por búsqueda
    if (this.searchTerm) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase()))
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'TODOS') {
      productosFiltrados = productosFiltrados.filter(producto => 
        producto.estado === this.filtroEstado
      );
    }

    // Filtro por stock
    if (this.filtroStock !== 'TODOS') {
      switch (this.filtroStock) {
        case 'STOCK_BAJO':
          productosFiltrados = productosFiltrados.filter(producto => 
            (producto.cantidad || 0) > 0 && (producto.cantidad || 0) <= (producto.stockMinimo || 10)
          );
          break;
        case 'SIN_STOCK':
          productosFiltrados = productosFiltrados.filter(producto => 
            (producto.cantidad || 0) === 0
          );
          break;
        case 'STOCK_NORMAL':
          productosFiltrados = productosFiltrados.filter(producto => 
            (producto.cantidad || 0) > (producto.stockMinimo || 10)
          );
          break;
      }
    }

    // Filtro por categoría
    if (this.filtroCategoria !== 'TODAS') {
      const categoriaId = Number(this.filtroCategoria);
      productosFiltrados = productosFiltrados.filter(producto => 
        producto.categoriaId === categoriaId
      );
    }

    this.productosFiltrados = productosFiltrados;
    this.calcularEstadisticas();
  }

  calcularEstadisticas() {
    this.productosActivos = this.productosFiltrados.filter(p => p.estado === 'ACTIVO').length;
    this.productosStockBajo = this.productosFiltrados.filter(p => 
      (p.cantidad || 0) > 0 && (p.cantidad || 0) <= (p.stockMinimo || 10)
    ).length;
    this.productosSinStock = this.productosFiltrados.filter(p => 
      (p.cantidad || 0) === 0
    ).length;
  }

  limpiarFiltros() {
    this.searchTerm = '';
    this.filtroEstado = 'TODOS';
    this.filtroStock = 'TODOS';
    this.filtroCategoria = 'TODAS';
    this.aplicarFiltros();
  }

  getNombreCategoria(categoriaId?: number): string {
    if (!categoriaId) return 'Sin categoría';
    const categoria = this.categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Categoría no encontrada';
  }

  editarProducto(id?: number) {
    if (id) {
      this.router.navigate(['/productos/editar', id]);
    }
  }

  eliminarProducto(id?: number) {
    if (id && confirm('¿Estás seguro de eliminar este producto?')) {
      this.productosService.deleteProducto(id).subscribe({
        next: () => {
          this.cargarProductos();
        },
        error: (error) => {
          console.error('Error eliminando producto:', error);
          alert('Error al eliminar el producto');
        }
      });
    }
  }

  cambiarEstado(producto: Producto) {
    const nuevoEstado = producto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const productoActualizado = { ...producto, estado: nuevoEstado };
    
    if (producto.id) {
      this.productosService.updateProducto(producto.id, productoActualizado).subscribe({
        next: () => {
          this.cargarProductos();
        },
        error: (error) => {
          console.error('Error actualizando producto:', error);
        }
      });
    }
  }

  getStockStatus(cantidad: number = 0, stockMinimo: number = 10): string {
    if (cantidad === 0) return 'bg-danger';
    if (cantidad <= stockMinimo) return 'bg-warning text-dark';
    return 'bg-success';
  }

  getEstadoBadge(estado: string = 'ACTIVO'): string {
    return estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary';
  }

  calcularValorTotal(): number {
    return this.productosFiltrados.reduce((total, producto) => {
      return total + ((producto.precioCompra || 0) * (producto.cantidad || 0));
    }, 0);
  }

  // Método para volver al menú principal
  volverAlMenu() {
    this.router.navigate(['/dashboard']);
  }
}