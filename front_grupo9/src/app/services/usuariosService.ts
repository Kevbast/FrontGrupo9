import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Usuario } from "../models/Usuario";
import { environment } from "../../environments/environment.development";

@Injectable()
export class UsuariosService {
    constructor(private _http: HttpClient){}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('authToken');
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    getUsuariosInscritosEventoActividad(idEvento: number, idActividad: number): Observable<Array<Usuario>> {
        let request = "api/Inscripciones/InscripcionesUsuariosEventoActividad/" + idEvento + "?idactividad=" + idActividad;
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.get<Array<Usuario>>(url, { headers: headers });
    }
}