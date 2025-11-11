import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, Usuario } from '../interfaces/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/auth';
  
  private tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());
  public token$ = this.tokenSubject.asObservable();
  
  private usuarioSubject = new BehaviorSubject<any>(null);
  public usuario$ = this.usuarioSubject.asObservable();

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.saveToken(response.token);
          this.saveUsuario(response.usuario);
        })
      );
  }

  register(usuario: Usuario): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, usuario);
  }

  private saveToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.tokenSubject.next(token);
  }

  private saveUsuario(usuario: any): void {
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem('authToken');
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user && user.rol === role;
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.tokenSubject.next(null);
    this.usuarioSubject.next(null);
  }

  initializeAuthState(): void {
    const token = this.getTokenFromStorage();
    const user = this.getCurrentUser();
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.usuarioSubject.next(user);
    }
  }
}

export type { LoginRequest };
