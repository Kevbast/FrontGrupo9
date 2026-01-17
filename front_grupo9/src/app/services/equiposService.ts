import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Equipo } from "../models/Equipo";
import { environment } from "../../environments/environment.development";
import { Usuario } from "../models/Usuario";
import { Curso } from "../models/Curso";
import { Color } from "../models/Color";

@Injectable()
export class EquiposService {
    
    constructor(private _http: HttpClient){}

    getEquiposActividadEvento(idActividad: number, idEvento: number): Observable<Array<Equipo>> {
        let request = "api/Equipos/EquiposActividadEvento/" + idActividad + "/" + idEvento;
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Equipo>>(url);
    }

    getJugadoresEquipo(idEquipo: number): Observable<Array<Usuario>> {
        let request = "api/Equipos/UsuariosEquipo/" + idEquipo;
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Usuario>>(url);
    }

    getCursosActivos(): Observable<Array<Curso>> {
        let request = "api/GestionEvento/CursosActivos";
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Curso>>(url);
    }

    getColorById(idColor: number): Observable<Color> {
        let request = "api/Colores/" + idColor;
        let url = environment.urlApiEventos + request;
        return this._http.get<Color>(url);
    }
}
