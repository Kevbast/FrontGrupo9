import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment.development";
import { Inscripcion } from "../models/Inscripcion"; 
import { Usuario } from "../models/Usuario";

@Injectable()
export class InscripcionesService {
    private urlInscripciones = environment.apiTorneo + 'api/inscripciones';
    private urlUsuarios = environment.apiTorneo + 'api/usuarios';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getInscripciones(): Observable<Inscripcion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Inscripcion[]>(this.urlInscripciones, { headers: headers });
  }

  // Obtener inscripciones por ID de actividad
  getInscripcionesPorActividad(idEventoActividad: number): Observable<Inscripcion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Inscripcion[]>(
      `${this.urlInscripciones}?idEventoActividad=${idEventoActividad}`,
      { headers: headers }
    );
  }

  crearInscripcion(inscripcion: Inscripcion): Observable<Inscripcion> {
    const url = environment.apiTorneo + 'api/Inscripciones/create';
    const headers = this.getAuthHeaders();
    
    const payload = {
      idUsuario: inscripcion.idUsuario,
      idEventoActividad: inscripcion.idEventoActividad,
      quiereSerCapitan: inscripcion.quiereSerCapitan,
      fechaInscripcion: inscripcion.fechaInscripcion
    };
    
    return this.http.post<Inscripcion>(url, payload, { headers: headers });
  }

  // Eliminar una inscripción
  eliminarInscripcion(idInscripcion: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.urlInscripciones}/${idInscripcion}`, { headers: headers });
  }

  // Obtener usuarios por IDs de usuario
  getUsuariosPorInscripcion(usuariosIds: number[]): Observable<Usuario[]> {
    // Si no hay IDs, retornar array vacío
    if (!usuariosIds || usuariosIds.length === 0) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    
    // Construir la query string con los IDs
    const idsQuery = usuariosIds.join(',');
    const headers = this.getAuthHeaders();
    return this.http.get<Usuario[]>(`${this.urlUsuarios}?ids=${idsQuery}`, { headers: headers });
  }
}