import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  usuario: {
    id: number;
    nombre: string;
    username: string;
    rol: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  initializeAuthState() {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          // Guardar token en localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.usuario));
        })
      );
  }

  register(usuario: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, usuario);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user && user.rol === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }
}