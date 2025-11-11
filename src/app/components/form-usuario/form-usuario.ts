import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsuarioService } from '../../services/usuarios';
import { Usuario, UsuarioForm } from '../../interfaces/usuario';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './form-usuario.html',
  styleUrls: ['./form-usuario.css']
})
export class FormUsuarioComponent implements OnInit {
  usuarioForm: FormGroup;
  isEdit: boolean = false;
  usuarioId: number | null = null;
  loading: boolean = false;
  error: string = '';

  roles = ['ADMIN', 'USER'];
  estados = ['ACTIVO', 'INACTIVO'];

  // Propiedades para las validaciones de password en el template
  passwordLengthValid: boolean = false;
  passwordUppercaseValid: boolean = false;
  passwordLowercaseValid: boolean = false;
  passwordNumberValid: boolean = false;
  passwordSpecialCharValid: boolean = false;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.usuarioForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.usuarioId = +params['id'];
        this.cargarUsuario(this.usuarioId);
      }
    });

    // Suscribirse a cambios en el campo password para actualizar las validaciones visuales
    this.passwordControl?.valueChanges.subscribe(value => {
      this.updatePasswordValidations(value);
    });
  }

  createForm(): FormGroup {
    const form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordValidator
      ]],
      confirmPassword: ['', Validators.required],
      rol: ['USER', Validators.required],
      estado: ['ACTIVO', Validators.required]
    }, { validators: this.passwordMatchValidator });

    return form;
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const errors: ValidationErrors = {};

    if (!hasUpperCase) errors['uppercase'] = true;
    if (!hasLowerCase) errors['lowercase'] = true;
    if (!hasNumeric) errors['numeric'] = true;
    if (!hasSpecialChar) errors['specialChar'] = true;

    return Object.keys(errors).length ? errors : null;
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  updatePasswordValidations(value: string): void {
    this.passwordLengthValid = value?.length >= 8 || false;
    this.passwordUppercaseValid = /[A-Z]/.test(value) || false;
    this.passwordLowercaseValid = /[a-z]/.test(value) || false;
    this.passwordNumberValid = /[0-9]/.test(value) || false;
    this.passwordSpecialCharValid = /[!@#$%^&*(),.?":{}|<>]/.test(value) || false;
  }

  cargarUsuario(id: number): void {
    this.loading = true;
    this.usuarioService.getUsuarioById(id).subscribe({
      next: (usuario) => {
        this.usuarioForm.patchValue({
          nombre: usuario.nombre,
          nombreUsuario: usuario.nombreUsuario,
          rol: usuario.rol,
          estado: usuario.estado,
          password: '',
          confirmPassword: ''
        });

        // En modo edición, hacer la contraseña opcional
        if (this.isEdit) {
          this.passwordControl?.clearValidators();
          this.passwordControl?.setValidators([
            Validators.minLength(8),
            this.passwordValidator
          ]);
          this.confirmPasswordControl?.clearValidators();
          
          this.passwordControl?.updateValueAndValidity();
          this.confirmPasswordControl?.updateValueAndValidity();
        }

        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar el usuario';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.usuarioForm.valid) {
      this.loading = true;
      
      // Crear objeto para enviar al backend
      const usuarioData: UsuarioForm = {
        nombre: this.usuarioForm.value.nombre,
        nombreUsuario: this.usuarioForm.value.nombreUsuario,
        rol: this.usuarioForm.value.rol,
        estado: this.usuarioForm.value.estado
      };

      // Solo incluir password si se proporcionó una nueva
      if (this.usuarioForm.value.password && this.usuarioForm.value.password !== '') {
        usuarioData.password = this.usuarioForm.value.password;
      }

      if (this.isEdit && this.usuarioId) {
        this.usuarioService.updateUsuario(this.usuarioId, usuarioData).subscribe({
          next: () => {
            this.router.navigate(['/usuarios']);
          },
          error: (error) => {
            this.handleError(error, 'actualizar');
          }
        });
      } else {
        this.usuarioService.createUsuario(usuarioData).subscribe({
          next: () => {
            this.router.navigate(['/usuarios']);
          },
          error: (error) => {
            this.handleError(error, 'crear');
          }
        });
      }
    } else {
      this.marcarCamposComoTocados();
    }
  }

  private handleError(error: any, action: string): void {
    this.loading = false;
    
    if (error.status === 400 && error.error?.error?.includes('nombre de usuario')) {
      this.error = 'El nombre de usuario ya existe';
      this.usuarioForm.get('nombreUsuario')?.setErrors({ 'duplicate': true });
    } else {
      this.error = `Error al ${action} el usuario`;
    }
    
    console.error('Error:', error);
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.usuarioForm.controls).forEach(key => {
      const control = this.usuarioForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para facilitar el acceso en el template
  get nombreControl() { return this.usuarioForm.get('nombre'); }
  get nombreUsuarioControl() { return this.usuarioForm.get('nombreUsuario'); }
  get passwordControl() { return this.usuarioForm.get('password'); }
  get confirmPasswordControl() { return this.usuarioForm.get('confirmPassword'); }
  get rolControl() { return this.usuarioForm.get('rol'); }
  get estadoControl() { return this.usuarioForm.get('estado'); }

  getPasswordErrors(): string[] {
    const errors: string[] = [];
    const passwordErrors = this.passwordControl?.errors;

    if (passwordErrors) {
      if (passwordErrors['required']) errors.push('La contraseña es requerida');
      if (passwordErrors['minlength']) errors.push('Mínimo 8 caracteres');
      if (passwordErrors['uppercase']) errors.push('Al menos una mayúscula');
      if (passwordErrors['lowercase']) errors.push('Al menos una minúscula');
      if (passwordErrors['numeric']) errors.push('Al menos un número');
      if (passwordErrors['specialChar']) errors.push('Al menos un carácter especial');
    }

    return errors;
  }
}