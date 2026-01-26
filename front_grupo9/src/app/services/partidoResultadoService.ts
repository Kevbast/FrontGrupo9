import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { PartidoResultado } from '../models/PartidoResultado';

@Injectable({
  providedIn: 'root',
})
export class PartidoResultadoService {
  private urlPartidos = environment.apiTorneo + 'api/PartidoResultado';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Obtener todos los partidos
  getPartidos(): Observable<PartidoResultado[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<PartidoResultado[]>(this.urlPartidos, { headers: headers });
  }

  // Obtener partidos por actividad
  getPartidosPorActividad(idEventoActividad: number): Observable<PartidoResultado[]> {
    const url = `${this.urlPartidos}/PartidosResultadosActividad/${idEventoActividad}`;
    const headers = this.getAuthHeaders();
    return this.http.get<PartidoResultado[]>(url, { headers: headers });
  }

  // Obtener partidos por equipo
  getPartidosPorEquipo(idEquipo: number): Observable<PartidoResultado[]> {
    const url = `${this.urlPartidos}/PartidosEquipo/${idEquipo}`;
    const headers = this.getAuthHeaders();
    return this.http.get<PartidoResultado[]>(url, { headers: headers });
  }

  // Obtener un partido por ID
  getPartido(id: number): Observable<PartidoResultado> {
    const url = `${this.urlPartidos}/${id}`;
    const headers = this.getAuthHeaders();
    return this.http.get<PartidoResultado>(url, { headers: headers });
  }

  // Crear partido
  crearPartido(partido: PartidoResultado): Observable<PartidoResultado> {
    const url = `${this.urlPartidos}/create`;
    const headers = this.getAuthHeaders();
    return this.http.post<PartidoResultado>(url, partido, { headers: headers });
  }

  // Actualizar partido
  actualizarPartido(partido: PartidoResultado): Observable<any> {
    const url = `${this.urlPartidos}/update`;
    const headers = this.getAuthHeaders();
    return this.http.put(url, partido, { headers: headers });
  }

  // Eliminar partido
  eliminarPartido(id: number): Observable<any> {
    const url = `${this.urlPartidos}/${id}`;
    const headers = this.getAuthHeaders();
    return this.http.delete(url, { headers: headers });
  }
}
