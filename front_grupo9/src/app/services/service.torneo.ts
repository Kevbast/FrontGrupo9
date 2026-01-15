import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

import { tap } from 'rxjs/operators'; // <--- Importante: Importar tap
import { Usuario } from '../models/Usuario';

// Interfaz para saber qué nos devuelve la API exactamente
export interface LoginResponse {
  response: string; // El Token
  role: string;
  idrole: number;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceTorneo {
  constructor(private _http: HttpClient) {}
  //Login funcional del Torneo
  login(nombre: string, contraseña: string): Observable<LoginResponse> {
    let apiUrl = environment.apiTorneo + 'api/auth/LoginEventos';
    let credentials = {
      userName: nombre,
      password: contraseña,
    };
    console.log(credentials);
    return this._http.post<LoginResponse>(apiUrl, credentials).pipe(
      tap((data: LoginResponse) => {
        //Capturamos la respuesta
        if (data.response) {
          //Guardamos el token
          localStorage.setItem('authToken', data.response);
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  cerrarSesion(): void {
    localStorage.removeItem('authToken');
    this.getToken();
  }

  //Procedemos con el header del cuerpo
  // Función auxiliar para generar los encabezados con el token
  private createAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();

    if (token) {
      // Si hay token, lo añadimos como Authorization Bearer
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('Headers creados manualmente con token.');
    } else {
      console.warn('Advertencia: Intento de acceso a ruta protegida sin token.');
    }
    return headers;
  }

  //Perfil del usuario
  getPerfil(): Observable<Usuario> {
    let request = 'api/UsuariosDeportes/Perfil';
    let apiUrl = environment.apiTorneo + request;
    // CORRECCIÓN: Aplicar los encabezados aquí
    const headers = this.createAuthHeaders();
    return this._http.get<Usuario>(apiUrl, { headers: headers });
  }
}
