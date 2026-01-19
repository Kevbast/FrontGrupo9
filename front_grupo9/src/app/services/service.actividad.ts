import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Inscripcion } from '../models/Inscripcion';
import { Actividad } from '../models/Actividad';
import { Usuario } from '../models/Usuario';

@Injectable({
  providedIn: 'root',
})
export class ActividadesService {
  private urlActividades = environment.apiTorneo + 'api/actividades';
  private urlInscripciones = environment.apiTorneo + 'api/inscripciones';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  getActividades(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(this.urlActividades);
  }

  getActividadesEvento(idEvento: number) : Observable<Array<Actividad>> {
    let request = "api/Actividades/ActividadesEvento/" + idEvento;
    let url = environment.apiTorneo + request;
    return this.http.get<Array<Actividad>>(url);
  }

  crearActividad(actividad: any): Observable<Actividad> {
    let request = "api/Actividades/create";
    let url = environment.apiTorneo + request;
    const headers = this.getAuthHeaders();
    
    const payload = {
      nombre: actividad.nombreActividad || actividad.Nombre || '',
      posicion: actividad.posicion || actividad.Posicion || 0,
      idEvento: actividad.idEvento || actividad.IdEvento || 0,
      idActividad: actividad.idActividad || actividad.IdActividad || 0,
      minimoJugadores: actividad.minimoJugadores || actividad.MinimoJugadores || 0,
      idProfesor: actividad.idProfesor || actividad.IdProfesor || 0,
      idEventoActividad: actividad.idEventoActividad || actividad.IdEventoActividad || 0,
      fechaEvento: actividad.fechaEvento || actividad.FechaEvento || new Date().toISOString()
    };
    
    return this.http.post<Actividad>(url, payload, { headers: headers });
  }

  crearEventoActividad(idEvento: number, idActividad: number): Observable<any> {
    let request = `api/ActividadesEvento/create?idevento=${idEvento}&idactividad=${idActividad}`;
    let url = environment.apiTorneo + request;
    const headers = this.getAuthHeaders();
    
    return this.http.post<any>(url, {}, { headers: headers });
  }

  actualizarActividad(actividad: Actividad): Observable<Actividad> {
    let request = "api/Actividades/update";
    let url = environment.apiTorneo + request;
    const headers = this.getAuthHeaders();
    
    const payload = {
      idActividad: actividad.idActividad,
      nombre: actividad.nombreActividad,
      nombreActividad: actividad.nombreActividad,
      posicion: actividad.posicion,
      idEvento: actividad.idEvento,
      minimoJugadores: actividad.minimoJugadores,
      idProfesor: actividad.idProfesor,
      idEventoActividad: actividad.idEventoActividad,
      fechaEvento: actividad.fechaEvento
    };
    
    return this.http.put<Actividad>(url, payload, { headers: headers });
  }
}
