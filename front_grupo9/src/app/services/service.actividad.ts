import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
    
    // Crear objeto con propiedades en camelCase para la API
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
    
    console.log('Payload enviado a API:', payload);
    console.log('URL:', url);
    return this.http.post<Actividad>(url, payload, { headers: headers });
  }

  crearEventoActividad(idEvento: number, idActividad: number): Observable<any> {
    let request = "api/ActividadesEvento/create";
    let url = environment.apiTorneo + request;
    const headers = this.getAuthHeaders();
    
    const payload = {
      idEvento: idEvento,
      idActividad: idActividad
    };
    
    console.log('=== ENVIANDO EventoActividad ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('URL completa:', url);
    console.log('Token presente:', !!localStorage.getItem('authToken'));
    console.log('Headers:', headers);
    
    return this.http.post<any>(url, payload, { headers: headers }).pipe(
      tap(response => {
        console.log('✅ Respuesta exitosa EventoActividad:', response);
      }),
      catchError(error => {
        console.log('❌ Error en EventoActividad:');
        console.log('Status:', error.status);
        console.log('Status Text:', error.statusText);
        console.log('Error completo:', error);
        if (error.error) {
          console.log('Error body:', error.error);
        }
        throw error;
      })
    );
  }

  actualizarActividad(actividad: Actividad): Observable<Actividad> {
    let request = "api/Actividades/update";
    let url = environment.apiTorneo + request;
    const headers = this.getAuthHeaders();
    
    // Crear objeto con propiedades - probando ambas versiones del nombre
    const payload = {
      idActividad: actividad.idActividad,
      nombre: actividad.nombreActividad,
      nombreActividad: actividad.nombreActividad,  // Añadir también nombreActividad por si el backend lo espera
      posicion: actividad.posicion,
      idEvento: actividad.idEvento,
      minimoJugadores: actividad.minimoJugadores,
      idProfesor: actividad.idProfesor,
      idEventoActividad: actividad.idEventoActividad,
      fechaEvento: actividad.fechaEvento
    };
    
    console.log('=== ACTUALIZANDO ACTIVIDAD ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('URL:', url);
    
    return this.http.put<Actividad>(url, payload, { headers: headers });
  }
    findUsuariosInscritosPorActividadEvento(idEvento: number, idActividad: number): Observable<Usuario[]> {
    let request = `api/Actividades/UsuariosInscritos/${idEvento}/${idActividad}`;
    let url = environment.apiTorneo + request;
    const headers = this.getAuthHeaders();
    
    return this.http.get<Usuario[]>(url, { headers: headers });
  }
}