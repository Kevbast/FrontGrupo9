import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Usuario } from "../models/Usuario";
import { environment } from "../../environments/environment.development";

@Injectable()
export class UsuariosService {
    constructor(private _http: HttpClient){}

    getUsuariosInscritosEventoActividad(idEvento: number, idActividad: number): Observable<Array<Usuario>> {
        let request = "api/Inscripciones/InscripcionesUsuariosEventoActividad/" + idEvento + "?idactividad=" + idActividad;
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Usuario>>(url);
    }
}