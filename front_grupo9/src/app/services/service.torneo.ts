import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

import { tap } from 'rxjs/operators'; // <--- Importante: Importar tap
import { Usuario } from '../models/Usuario';
import { ActividadUser } from '../models/ActividadesUser';
import { Curso } from '../models/Curso';
import { UsuariosCurso } from '../models/UsuariosCurso';
import { Actividades } from '../models/Actividades';

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
  login(nombre: string, contraseña: string): Observable<LoginResponse> {
    let apiUrl = environment.apiTorneo + 'api/auth/LoginEventos';
    let credentials = {
      userName: nombre,
      password: contraseña,
    };
    return this._http.post<LoginResponse>(apiUrl, credentials).pipe(
      tap((data: LoginResponse) => {
        if (data.response) {
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

  //Para el perfil(UsuarioDeportes)
  getActividadesInscritas(): Observable<ActividadUser[]> {
    const url = environment.apiTorneo + '/api/UsuariosDeportes/ActividadesUser';
    const headers = this.createAuthHeaders();
    return this._http.get<ActividadUser[]>(url, { headers: headers });
  }

  //ORGANIZADOR(VISTA ADMIN)
  asignarRolOrganizador(idUsuario: number): Observable<any> {
    const url = environment.apiTorneo + '/api/UsuariosDeportes/AsignarOrganizador/'+idUsuario;
    const headers = this.createAuthHeaders();
    return this._http.post<any>(url, {}, { headers: headers });
  }
  getCursosActivos(): Observable<Array<Curso>> {
    let request = "/api/GestionEvento/CursosActivos"; 
    let url = environment.urlApiEventos + request;
    const headers = this.createAuthHeaders();
    return this._http.get<Array<Curso>>(url, { headers: headers });
  }
  getUsuariosPorCurso(idCurso:number): Observable<Array<UsuariosCurso>> {
    let request = "/api/GestionEvento/UsuariosCurso/"+idCurso; 
    let url = environment.urlApiEventos + request;
    const headers = this.createAuthHeaders();
    return this._http.get<Array<UsuariosCurso>>(url, { headers: headers });
  }

  //VISTA CRUD ACTIVIDADES(En perfil)
  getActividades(): Observable<Actividades[]> {
    const url = environment.apiTorneo + '/api/Actividades';
    const headers = this.createAuthHeaders();
    return this._http.get<Actividades[]>(url, { headers: headers });
  }
  crearActividad(actividad: Actividades): Observable<any> {
    const url = environment.apiTorneo + '/api/Actividades/create';
    const headers = this.createAuthHeaders();
    return this._http.post(url, actividad, { headers: headers });
  }
  actualizarActividad(actividad: Actividades): Observable<any> {
    const url = environment.apiTorneo + '/api/Actividades/update';
    const headers = this.createAuthHeaders();
    return this._http.put(url, actividad, { headers: headers });
  }
  deleteActividad(idActividad: number): Observable<any> {
    const url = environment.apiTorneo + '/api/Actividades/'+idActividad;
    const headers = this.createAuthHeaders();
    return this._http.delete(url, { headers: headers });
  }    

}
