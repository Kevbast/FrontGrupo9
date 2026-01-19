import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Inscripcion } from '../models/Inscripcion';
import { Actividad } from '../models/Actividad';
import { Usuario } from '../models/Usuario';
import { Pagos } from '../models/Pagos';
import { PagosCompletos } from '../models/PagosCompletos';

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

  eliminarInscripcion(idInscripcion: number): Observable<any> {
    return this.http.delete(`${this.urlInscripciones}/${idInscripcion}`);
  }
  //Método para devolver todos los Usuarios inscritos por evento y actividad de la BBDD(Kevin)
  findUsuariosInscritosPorActividadEvento(idEvento:number,idactividad:number):Observable<Array<Usuario>>{
        let request="api/Inscripciones/InscripcionesUsuariosEventoActividad/"+idEvento+"?idactividad="+idactividad;
        let apiUrl=environment.apiTorneo + request;
        return this.http.get<Array<Usuario>>(apiUrl);
  }

  // 1. OBTENER TODOS LOS PRECIOS
  getPrecios(): Observable<any[]> {
    return this.http.get<any[]>(environment.apiTorneo + 'api/PrecioActividad');
  }
  // 2. ASIGNAR PRECIO 
  crearPrecioActividad(idEventoActividad: number, precio: number): Observable<any> {
    const url = environment.apiTorneo + 'api/PrecioActividad/create';
    const body = {
      idPrecioActividad:0,//Se autoincrementa
      idEventoActividad: idEventoActividad,
      precioTotal: precio
    };
    return this.http.post(url, body); 
  }
  // 3. Actualizar PRECIO
  actualizarPrecioActividad(idPrecioActividad: number, idEventoActividad: number, precio: number): Observable<any> {
  const url = environment.apiTorneo + 'api/PrecioActividad/update';
  
  const body = {
    idPrecioActividad: idPrecioActividad, // ¡CRUCIAL! Para saber cuál actualizar
    idEventoActividad: idEventoActividad,
    precioTotal: precio
  };
  
  return this.http.put(url, body);
}

// 4. ELIMINAR PRECIO
  eliminarPrecioActividad(idPrecioActividad: number): Observable<any> {
  const url = environment.apiTorneo + 'api/PrecioActividad/' + idPrecioActividad;
  return this.http.delete(url);
  }

  //GESTIÓN DE PAGOS 
  getPagosEvento(idEvento: number): Observable<PagosCompletos[]> {
  const url = `${environment.apiTorneo}api/Pagos/PagosEvento/${idEvento}`;
  return this.http.get<PagosCompletos[]>(url);
  }

  // Crea un nuevo registro de pago (recibo)
  crearPago(pago: Pagos): Observable<any> {
    const url = `${environment.apiTorneo}api/Pagos/create`;
    return this.http.post(url, pago);
  }

  updatePago(pago: Pagos): Observable<any> {
    // Ajusta la URL si es distinta (PUT /api/Pagos suele ser lo estándar)
    const url = `${environment.apiTorneo}api/Pagos/update`; 
    return this.http.put(url, pago);
  }

  deletePago(idPago: number): Observable<any> {
    const url = `${environment.apiTorneo}api/Pagos/${idPago}`;
    return this.http.delete(url);
  }

}
