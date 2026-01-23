import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Evento } from "../models/Evento";
import { environment } from "../../environments/environment.development";
import { Usuario } from "../models/Usuario";
import { ServiceTorneo } from "./service.torneo";


@Injectable()
export class EventosService {
    constructor(private _http: HttpClient, private _serviceTorneo: ServiceTorneo){}

    //No quitar por ahora
    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('authToken');
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    getEventos(): Observable<Array<Evento>> {
        let request = "api/Eventos"
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();//No quitar por ahora
        return this._http.get<Array<Evento>>(url, { headers: headers });
    }

    getProfesoresActivosSinEvento(): Observable<Array<Usuario>> {
        let request = "api/ProfesEventos/ProfesSinEventos";
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();//No quitar por ahora
        return this._http.get<Array<Usuario>>(url, { headers: headers });
    }

    createEvento(evento: Evento): Observable<any> {
        let request = "api/Eventos/create/" + evento.fechaEvento;
        let url = environment.urlApiEventos + request;
        let headers = new HttpHeaders();
        let token = this._serviceTorneo.getToken();
        headers = headers.set('Authorization', `Bearer ${token}`);
        return this._http.post(url, evento, {headers: headers});
    }

    updateEvento(evento: Evento): Observable<any> {
        let request = "api/Eventos/update";
        let url = environment.urlApiEventos + request;
        let headers = new HttpHeaders();
        let token = this._serviceTorneo.getToken();
        headers = headers.set('Authorization', `Bearer ${token}`);
        return this._http.put(url, evento, {headers: headers});
    }

    deleteEvento(idEvento: number): Observable<any> {
        let request = "api/Eventos/" + idEvento;
        let url = environment.urlApiEventos + request;
        let headers = new HttpHeaders();
        let token = this._serviceTorneo.getToken();
        headers = headers.set('Authorization', `Bearer ${token}`);
        return this._http.delete(url, {headers: headers});
    }
}