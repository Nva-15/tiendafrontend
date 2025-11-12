import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { DashboardComponent } from './components/dashboard/dashboard';
import { authGuard } from './guards/auth-guard';
import { ListaProductosComponent } from './components/lista-productos/lista-productos';
import { FormProductoComponent } from './components/form-producto/form-producto';
import { ListaUsuariosComponent } from './components/lista-usuarios/lista-usuarios';
import { FormUsuarioComponent } from './components/form-usuario/form-usuario';
import { ListaCategoriasComponent } from './components/lista-categorias/lista-categorias';
import { FormCategoriaComponent } from './components/form-categoria/form-categoria';
import { AyudaComponent } from './components/ayuda/ayuda';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent, 
    title: 'Login' 
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    title: 'Dashboard',
    canActivate: [authGuard]
  },
  { 
    path: 'productos', 
    component: ListaProductosComponent, 
    title: 'Productos',
    canActivate: [authGuard]
  },
  { 
    path: 'productos/nuevo', 
    component: FormProductoComponent, 
    title: 'Nuevo Producto',
    canActivate: [authGuard]
  },
  { 
    path: 'productos/editar/:id', 
    component: FormProductoComponent, 
    title: 'Editar Producto',
    canActivate: [authGuard]
  }, 
  { 
    path: 'usuarios', 
    component: ListaUsuariosComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  { 
    path: 'usuarios/nuevo', 
    component: FormUsuarioComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  { 
    path: 'usuarios/editar/:id', 
    component: FormUsuarioComponent,
    canActivate: [authGuard],
    data: { roles: ['ADMIN'] }
  },
  { 
    path: 'categorias', 
    component: ListaCategoriasComponent, 
    title: 'Categorías',
    canActivate: [authGuard]
  },
  { 
    path: 'categorias/nuevo', 
    component: FormCategoriaComponent, 
    title: 'Nueva Categoría',
    canActivate: [authGuard]
  },
  { 
    path: 'categorias/editar/:id', 
    component: FormCategoriaComponent, 
    title: 'Editar Categoría',
    canActivate: [authGuard]
  },
  { 
    path: 'ayuda', 
    component: AyudaComponent, 
    title: 'Ayuda y Soporte',
    canActivate: [authGuard]
  },
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];