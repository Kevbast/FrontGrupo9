import { HttpClient } from "@angular/common/http";
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
    return this.http.get<Usuario[]>(`${this.urlUsuarios}?ids=${idsQuery}`);
  }
}