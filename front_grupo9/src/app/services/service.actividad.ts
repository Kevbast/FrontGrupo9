import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Inscripcion } from '../models/Inscripcion';
import { Actividad } from '../models/Actividad';


@Injectable({
  providedIn: 'root'
})
export class ActividadesService {
  private urlActividades = environment.apiTorneo + 'api/actividades';
  private urlInscripciones = environment.apiTorneo + 'api/inscripciones';

  constructor(private http: HttpClient) {}

  // Obtener todas las actividades
  getActividades(): Observable<Actividad[]> {
    return this.http.get<Actividad[]>(this.urlActividades);
  }
}