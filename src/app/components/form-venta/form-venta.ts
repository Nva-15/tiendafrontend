import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VentasService } from '../../services/ventas';
import { CategoriasService } from '../../services/categorias';
import { ClientesService } from '../../services/clientes';
import { AuthService } from '../../services/auth';
import { VentaRequest, DetalleVentaRequest, Producto, Cliente } from '../../interfaces/venta';
import { Categoria } from '../../interfaces/categoria';

@Component({
  selector: 'app-form-venta',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './form-venta.html',
  styleUrl: './form-venta.css'
})
export class FormVentaComponent implements OnInit {
  private ventasService = inject(VentasService);
  private categoriasService = inject(CategoriasService);
  private clientesService = inject(ClientesService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  ventaForm: FormGroup;
  isLoading = false;
  isBuscandoCliente = false;
  errorMessage = '';
  successMessage = '';
  mostrarFormCliente = false;
  clienteExistente: Cliente | null = null;

  // Datos para los selectores
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  tiposPago = ['EFECTIVO', 'TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA'];

  // Variable para DNI de búsqueda
  dniBusqueda: string = '';

  // Map para productos seleccionados temporalmente
  productosSeleccionados: Map<number, number> = new Map();

  // Variable para controlar el método de pago
  metodoPagoSeleccionado: string = 'EFECTIVO';

  constructor() {
    this.ventaForm = this.fb.group({
      // Datos del cliente (para nuevo cliente)
      clienteNombre: ['', Validators.required],
      clienteDni: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(8)]],
      clienteCorreo: ['', Validators.email],
      clienteTelefono: ['', [Validators.minLength(9), Validators.maxLength(9), Validators.pattern('^[0-9]*$')]],
      clienteDireccion: [''],
      // Información de venta
      tipoPago: ['EFECTIVO', Validators.required],
      detalles: this.fb.array([], Validators.required)
    });
  }

  ngOnInit() {
    this.cargarDatosIniciales();
    // Forzar el valor por defecto
    this.ventaForm.patchValue({
      tipoPago: 'EFECTIVO'
    });
    this.metodoPagoSeleccionado = 'EFECTIVO';
  }

  get detalles(): FormArray {
    return this.ventaForm.get('detalles') as FormArray;
  }

  cargarDatosIniciales() {
    this.isLoading = true;

    this.categoriasService.getCategoriasActivas().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.errorMessage = 'Error al cargar las categorías';
      }
    });

    this.ventasService.getProductosActivos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.productosFiltrados = productos;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.errorMessage = 'Error al cargar los productos';
        this.isLoading = false;
      }
    });
  }

  getUsuarioAutenticado(): any {
    const usuario = this.authService.getCurrentUser();
    return usuario;
  }

  getUsuarioId(): number {
    const usuario = this.getUsuarioAutenticado();
    if (usuario && usuario.id) {
      return usuario.id;
    }
    return 0;
  }

  // BUSCAR CLIENTE POR DNI
  buscarCliente() {
    if (!this.dniBusqueda || this.dniBusqueda.length !== 8) {
      this.errorMessage = 'Ingrese un DNI válido de 8 dígitos';
      return;
    }

    this.isBuscandoCliente = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.clientesService.getClienteByDni(this.dniBusqueda).subscribe({
      next: (cliente) => {
        this.isBuscandoCliente = false;
        this.clienteExistente = cliente;
        this.mostrarFormCliente = false;
        
        this.ventaForm.patchValue({
          clienteNombre: cliente.nombre,
          clienteDni: cliente.dni,
          clienteCorreo: cliente.correo || '',
          clienteTelefono: cliente.telefono || '',
          clienteDireccion: cliente.direccion || ''
        });

        this.successMessage = `Cliente encontrado: ${cliente.nombre}`;
      },
      error: (error) => {
        this.isBuscandoCliente = false;
        
        if (error.status === 404) {
          this.clienteExistente = null;
          this.mostrarFormCliente = true;
          
          this.ventaForm.patchValue({
            clienteDni: this.dniBusqueda,
            clienteNombre: '',
            clienteCorreo: '',
            clienteTelefono: '',
            clienteDireccion: ''
          });

          this.successMessage = 'Cliente no encontrado. Complete los datos para registrarlo.';
        } else {
          this.errorMessage = 'Error al buscar cliente';
        }
      }
    });
  }

  limpiarBusquedaCliente() {
    this.dniBusqueda = '';
    this.clienteExistente = null;
    this.mostrarFormCliente = false;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.ventaForm.patchValue({
      clienteNombre: '',
      clienteDni: '',
      clienteCorreo: '',
      clienteTelefono: '',
      clienteDireccion: '',
      tipoPago: 'EFECTIVO'
    });
    this.metodoPagoSeleccionado = 'EFECTIVO';
  }

  // ACTUALIZAR MÉTODO DE PAGO
  actualizarMetodoPago(event: any) {
    const nuevoMetodo = event.target.value;
    this.metodoPagoSeleccionado = nuevoMetodo;
    this.ventaForm.patchValue({
      tipoPago: nuevoMetodo
    });
    console.log('Método de pago actualizado:', nuevoMetodo);
  }

  // MÉTODOS PARA INTERFAZ CON BOTONES +/-
  getCategoriaNombre(categoriaId: number): string {
    const categoria = this.categorias.find(c => c.id === categoriaId);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

  filtrarProductosPorCategoria(event: any) {
    const categoriaId = event.target.value;
    
    if (categoriaId) {
      this.productosFiltrados = this.productos.filter(p => p.categoriaId === +categoriaId);
    } else {
      this.productosFiltrados = this.productos;
    }
  }

  filtrarProductosPorNombre(event: any) {
    const termino = event.target.value.toLowerCase();
    if (termino) {
      this.productosFiltrados = this.productos.filter(p => 
        p.nombre.toLowerCase().includes(termino)
      );
    } else {
      this.productosFiltrados = this.productos;
    }
  }

  getCantidadSeleccionada(productoId: number): number {
    return this.productosSeleccionados.get(productoId) || 0;
  }

  incrementarCantidad(producto: Producto) {
    const current = this.getCantidadSeleccionada(producto.id);
    if (current < producto.cantidad) {
      this.productosSeleccionados.set(producto.id, current + 1);
    }
  }

  decrementarCantidad(producto: Producto) {
    const current = this.getCantidadSeleccionada(producto.id);
    if (current > 0) {
      this.productosSeleccionados.set(producto.id, current - 1);
    }
  }

  actualizarCantidad(producto: Producto, event: any) {
    const cantidad = parseInt(event.target.value) || 0;
    if (cantidad >= 0 && cantidad <= producto.cantidad) {
      this.productosSeleccionados.set(producto.id, cantidad);
    } else if (cantidad > producto.cantidad) {
      this.productosSeleccionados.set(producto.id, producto.cantidad);
      event.target.value = producto.cantidad;
    }
  }

  agregarProductoAlCarrito(producto: Producto) {
    const cantidad = this.getCantidadSeleccionada(producto.id);
    if (cantidad > 0 && cantidad <= producto.cantidad) {
      const existingIndex = this.detalles.controls.findIndex(
        detalle => detalle.get('productoId')?.value === producto.id
      );

      if (existingIndex >= 0) {
        const detalle = this.detalles.at(existingIndex);
        const nuevaCantidad = detalle.get('cantidad')?.value + cantidad;
        
        if (nuevaCantidad <= producto.cantidad) {
          detalle.patchValue({
            cantidad: nuevaCantidad
          });
          this.calcularSubtotal(detalle as FormGroup);
        } else {
          this.errorMessage = `No hay suficiente stock. Stock disponible: ${producto.cantidad}`;
          return;
        }
      } else {
        const detalleForm = this.fb.group({
          productoId: [producto.id, Validators.required],
          cantidad: [cantidad, [Validators.required, Validators.min(1)]],
          precioUnitario: [producto.precioVenta, [Validators.required, Validators.min(0.01)]],
          subtotal: [{value: cantidad * producto.precioVenta, disabled: true}]
        });
        this.detalles.push(detalleForm);
      }

      this.productosSeleccionados.set(producto.id, 0);
      this.errorMessage = '';
    }
  }

  // MÉTODOS PARA CALCULAR Y MANEJAR DETALLES
  calcularSubtotal(detalleForm: FormGroup) {
    const cantidad = detalleForm.get('cantidad')?.value || 0;
    const precio = detalleForm.get('precioUnitario')?.value || 0;
    const subtotal = cantidad * precio;
    
    detalleForm.patchValue({ subtotal }, { emitEvent: false });
  }

  eliminarDetalle(index: number) {
    this.detalles.removeAt(index);
  }

  getTotalVenta(): number {
    return this.detalles.controls.reduce((total, detalle) => {
      return total + (detalle.get('subtotal')?.value || 0);
    }, 0);
  }

  getProductoNombre(productoId: any): string {
    if (!productoId) return 'Seleccione un producto';
    
    const id = +productoId;
    const producto = this.productos.find(p => p.id === id);
    return producto ? producto.nombre : 'Producto no encontrado';
  }

  getStockProducto(productoId: any): number {
    if (!productoId) return 0;
    
    const id = +productoId;
    const producto = this.productos.find(p => p.id === id);
    return producto ? (producto.cantidad || 0) : 0;
  }

  validarStock(): boolean {
    for (let i = 0; i < this.detalles.length; i++) {
      const detalle = this.detalles.at(i);
      const productoId = detalle.get('productoId')?.value;
      const cantidad = detalle.get('cantidad')?.value;
      
      if (productoId && cantidad) {
        const stock = this.getStockProducto(productoId);
        if (cantidad > stock) {
          this.errorMessage = `Stock insuficiente para ${this.getProductoNombre(productoId)}. Stock disponible: ${stock}`;
          return false;
        }
      }
    }
    return true;
  }

  tieneDetallesCompletos(): boolean {
    if (this.detalles.length === 0) return false;
    
    return this.detalles.controls.every(detalle => {
      const productoId = detalle.get('productoId')?.value;
      const cantidad = detalle.get('cantidad')?.value;
      const precio = detalle.get('precioUnitario')?.value;
      
      return productoId && cantidad > 0 && precio > 0 && detalle.valid;
    });
  }

  esFormularioValido(): boolean {
    const clienteValido = this.clienteExistente || this.mostrarFormCliente;
    const detallesValidos = this.tieneDetallesCompletos();
    const stockValido = this.validarStock();
    
    return this.ventaForm.valid && detallesValidos && clienteValido && stockValido;
  }

  async onSubmit() {
    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Debe estar autenticado para realizar una venta';
      return;
    }

    const usuarioId = this.getUsuarioId();
    if (!usuarioId) {
      this.errorMessage = 'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.';
      return;
    }

    if (!this.clienteExistente && !this.mostrarFormCliente) {
      this.errorMessage = 'Primero busque o registre un cliente';
      return;
    }

    if (this.detalles.length === 0) {
      this.errorMessage = 'Agregue al menos un producto a la venta';
      return;
    }

    if (!this.tieneDetallesCompletos()) {
      this.errorMessage = 'Complete todos los productos correctamente';
      this.marcarCamposComoTouched();
      return;
    }

    if (!this.validarStock()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      let clienteId: number;

      if (this.clienteExistente) {
        clienteId = this.clienteExistente.id!;
      } else {
        const nuevoCliente: Cliente = {
          nombre: this.ventaForm.get('clienteNombre')?.value,
          dni: this.ventaForm.get('clienteDni')?.value,
          correo: this.ventaForm.get('clienteCorreo')?.value || undefined,
          telefono: this.ventaForm.get('clienteTelefono')?.value || undefined,
          direccion: this.ventaForm.get('clienteDireccion')?.value || undefined
        };

        const clienteCreado = await this.clientesService.createCliente(nuevoCliente).toPromise();
        if (!clienteCreado?.id) {
          throw new Error('Error al crear el cliente');
        }
        clienteId = clienteCreado.id;
      }

      const ventaData: VentaRequest = {
        clienteId: clienteId,
        usuarioId: usuarioId,
        tipoPago: this.ventaForm.get('tipoPago')?.value,
        detalles: this.detalles.controls.map(detalle => ({
          productoId: detalle.get('productoId')?.value,
          cantidad: detalle.get('cantidad')?.value,
          precioUnitario: detalle.get('precioUnitario')?.value
        }))
      };

      this.ventasService.createVenta(ventaData).subscribe({
        next: (ventaCreada) => {
          this.isLoading = false;
          this.successMessage = `¡Venta exitosa! Total: S/. ${ventaCreada.total}`;
          
          setTimeout(() => {
            this.router.navigate(['/ventas']);
          }, 2000);
        },
        error: (error) => {
          console.error('Error creando venta:', error);
          this.errorMessage = error.error?.error || 'Error al crear la venta';
          this.isLoading = false;
        }
      });

    } catch (error: any) {
      console.error('Error procesando venta:', error);
      this.errorMessage = error.message || 'Error al procesar la venta';
      this.isLoading = false;
    }
  }

  marcarCamposComoTouched() {
    this.ventaForm.markAllAsTouched();
    this.detalles.controls.forEach(detalle => {
      detalle.markAsTouched();
    });
  }

  getClienteNombre(): string {
    return this.ventaForm.get('clienteNombre')?.value || 'No especificado';
  }

  getClienteDni(): string {
    return this.ventaForm.get('clienteDni')?.value || 'No especificado';
  }

  getIGV(): number {
    return this.getTotalVenta() * 0.18;
  }

  getTotalConIGV(): number {
    return this.getTotalVenta() + this.getIGV();
  }

  // GETTERS PARA CONTROLES (corregidos con aserción de tipo)
  get tipoPago() { return this.ventaForm.get('tipoPago') as FormControl; }
  get clienteNombre() { return this.ventaForm.get('clienteNombre') as FormControl; }
  get clienteDni() { return this.ventaForm.get('clienteDni') as FormControl; }
  get clienteTelefono() { return this.ventaForm.get('clienteTelefono') as FormControl; }
  get clienteCorreo() { return this.ventaForm.get('clienteCorreo') as FormControl; }
  get clienteDireccion() { return this.ventaForm.get('clienteDireccion') as FormControl; }

  irAlMenuPrincipal() {
    this.router.navigate(['/dashboard']);
  }
}