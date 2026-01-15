import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment.development";
import { Inscripcion } from "../models/Inscripcion"; 

@Injectable()
export class InscripcionesService {
    private urlInscripciones = environment.apiTorneo + 'api/inscripciones';

  constructor(private http: HttpClient) {}

  getInscripciones(): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(this.urlInscripciones);
  }

  // Obtener inscripciones por ID de actividad
  getInscripcionesPorActividad(idEventoActividad: number): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(
      `${this.urlInscripciones}?idEventoActividad=${idEventoActividad}`
    );
  }

  crearInscripcion(inscripcion: Inscripcion): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(this.urlInscripciones, inscripcion);
  }

  // Eliminar una inscripción
  eliminarInscripcion(idInscripcion: number): Observable<any> {
    return this.http.delete(`${this.urlInscripciones}/${idInscripcion}`);
  }
}