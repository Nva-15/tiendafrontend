export interface Usuario {
    id?: number;
    nombre: string;
    nombreUsuario: string;
    password?: string;
    rol: string;
    estado: string;
    fechaCreacion?: string;
  }
  
  export interface UsuarioResponse {
    id: number;
    nombre: string;
    nombreUsuario: string;
    rol: string;
    estado: string;
    fechaCreacion: string;
  }