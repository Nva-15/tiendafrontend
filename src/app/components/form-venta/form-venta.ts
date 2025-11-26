import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
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
  }

  get detalles(): FormArray {
    return this.ventaForm.get('detalles') as FormArray;
  }

  cargarDatosIniciales() {
    this.isLoading = true;

    // Cargar categorías activas
    this.categoriasService.getCategoriasActivas().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Error cargando categorías:', error);
        this.errorMessage = 'Error al cargar las categorías';
      }
    });

    // Cargar productos activos
    this.ventasService.getProductosActivos().subscribe({
      next: (productos) => {
        console.log('Productos cargados:', productos);
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

  // OBTENER USUARIO AUTENTICADO
  getUsuarioAutenticado(): any {
    const usuario = this.authService.getCurrentUser();
    console.log('Usuario autenticado:', usuario);
    return usuario;
  }

  // OBTENER ID DE USUARIO AUTENTICADO
  getUsuarioId(): number {
    const usuario = this.getUsuarioAutenticado();
    if (usuario && usuario.id) {
      return usuario.id;
    }
    
    const token = this.authService.getToken();
    if (token) {
      console.warn('Usuario no encontrado en localStorage pero hay token');
    }
    
    console.error('No se pudo obtener el ID del usuario autenticado');
    return 0;
  }

  // Método para buscar cliente por DNI
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
        
        // Llenar formulario con datos del cliente existente
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
          // Cliente no encontrado - activar formulario para nuevo cliente
          this.clienteExistente = null;
          this.mostrarFormCliente = true;
          
          // Pre-llenar DNI
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
    
    // Resetear formulario de cliente
    this.ventaForm.patchValue({
      clienteNombre: '',
      clienteDni: '',
      clienteCorreo: '',
      clienteTelefono: '',
      clienteDireccion: ''
    });
  }

  filtrarProductosPorCategoria(event: any) {
    const categoriaId = event.target.value;
    
    if (categoriaId) {
      this.productosFiltrados = this.productos.filter(p => p.categoriaId === +categoriaId);
    } else {
      this.productosFiltrados = this.productos;
    }
  }

  agregarDetalle() {
    const detalleForm = this.fb.group({
      productoId: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0, [Validators.required, Validators.min(0.01)]],
      subtotal: [{value: 0, disabled: true}]
    });

    // Cuando se selecciona un producto, cargar su precio
    detalleForm.get('productoId')?.valueChanges.subscribe(productoId => {
      console.log('Producto seleccionado:', productoId, 'Tipo:', typeof productoId);
      if (productoId) {
        const producto = this.productos.find(p => p.id === +productoId);
        console.log('Producto encontrado:', producto);
        if (producto) {
          detalleForm.patchValue({
            precioUnitario: producto.precioVenta || 0
          }, { emitEvent: false });
        }
      }
    });

    // Calcular subtotal automáticamente
    detalleForm.get('cantidad')?.valueChanges.subscribe(() => {
      this.calcularSubtotal(detalleForm);
    });

    detalleForm.get('precioUnitario')?.valueChanges.subscribe(() => {
      this.calcularSubtotal(detalleForm);
    });

    this.detalles.push(detalleForm);
  }

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

  // Manejar conversión de tipos
  getProductoNombre(productoId: any): string {
    if (!productoId) return 'Seleccione un producto';
    
    const id = +productoId;
    const producto = this.productos.find(p => p.id === id);
    return producto ? producto.nombre : 'Producto no encontrado';
  }

  // Manejar conversión de tipos
  getStockProducto(productoId: any): number {
    if (!productoId) return 0;
    
    const id = +productoId;
    const producto = this.productos.find(p => p.id === id);
    return producto ? (producto.cantidad || 0) : 0;
  }

  // Validación mejorada
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

  // Validación de detalles
  tieneDetallesCompletos(): boolean {
    if (this.detalles.length === 0) return false;
    
    return this.detalles.controls.every(detalle => {
      const productoId = detalle.get('productoId')?.value;
      const cantidad = detalle.get('cantidad')?.value;
      const precio = detalle.get('precioUnitario')?.value;
      
      return productoId && cantidad > 0 && precio > 0 && detalle.valid;
    });
  }

  // Validación completa del formulario
  esFormularioValido(): boolean {
    const clienteValido = this.clienteExistente || this.mostrarFormCliente;
    const detallesValidos = this.tieneDetallesCompletos();
    const stockValido = this.validarStock();
    
    console.log('Validación:', {
      clienteValido,
      detallesValidos,
      stockValido,
      formValid: this.ventaForm.valid,
      detallesLength: this.detalles.length
    });
    
    return this.ventaForm.valid && detallesValidos && clienteValido && stockValido;
  }

  async onSubmit() {
    console.log('Validando formulario...');
    
    // VERIFICAR AUTENTICACIÓN
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
        // Usar cliente existente
        clienteId = this.clienteExistente.id!;
        console.log('Usando cliente existente ID:', clienteId);
      } else {
        // Crear nuevo cliente
        const nuevoCliente: Cliente = {
          nombre: this.ventaForm.get('clienteNombre')?.value,
          dni: this.ventaForm.get('clienteDni')?.value,
          correo: this.ventaForm.get('clienteCorreo')?.value || undefined,
          telefono: this.ventaForm.get('clienteTelefono')?.value || undefined,
          direccion: this.ventaForm.get('clienteDireccion')?.value || undefined
        };

        console.log('Creando nuevo cliente:', nuevoCliente);
        const clienteCreado = await this.clientesService.createCliente(nuevoCliente).toPromise();
        if (!clienteCreado?.id) {
          throw new Error('Error al crear el cliente');
        }
        clienteId = clienteCreado.id;
        console.log('Cliente creado ID:', clienteId);
      }

      // Crear la venta CON USUARIO AUTENTICADO
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

      console.log('Enviando venta con usuario ID:', usuarioId, 'Datos:', ventaData);
      this.ventasService.createVenta(ventaData).subscribe({
        next: (ventaCreada) => {
          console.log('Venta creada:', ventaCreada);
          this.isLoading = false;
          this.successMessage = `Venta creada exitosamente. Total: S/. ${ventaCreada.total}`;
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

  // Cálculo de IGV
  getIGV(): number {
    return this.getTotalVenta() * 0.18;
  }

  // Cálculo de total con IGV
  getTotalConIGV(): number {
    return this.getTotalVenta() + this.getIGV();
  }

  // Getters para acceder fácilmente a los controles
  get tipoPago() { return this.ventaForm.get('tipoPago'); }
  get clienteNombre() { return this.ventaForm.get('clienteNombre'); }
  get clienteDni() { return this.ventaForm.get('clienteDni'); }
  get clienteTelefono() { return this.ventaForm.get('clienteTelefono'); }
  get clienteCorreo() { return this.ventaForm.get('clienteCorreo'); }
}