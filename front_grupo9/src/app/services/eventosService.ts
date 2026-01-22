import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Evento } from "../models/Evento";
import { environment } from "../../environments/environment.development";
import { Usuario } from "../models/Usuario";



@Injectable()
export class EventosService {
    constructor(private _http: HttpClient){}

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
        const headers = this.getAuthHeaders();
        return this._http.get<Array<Evento>>(url, { headers: headers });
    }

    getProfesoresActivosSinEvento(): Observable<Array<Usuario>> {
        let request = "api/ProfesEventos/ProfesSinEventos";
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.get<Array<Usuario>>(url, { headers: headers });
    }

    createEvento(evento: Evento): Observable<any> {
        let request = "api/Eventos/create/" + evento.fechaEvento;
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.post(url, evento, { headers: headers });
    }

    updateEvento(evento: Evento): Observable<any> {
        let request = "api/Eventos/update";
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.put(url, evento, { headers: headers });
    }

    deleteEvento(idEvento: number): Observable<any> {
        let request = "api/Eventos/" + idEvento;
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.delete(url, { headers: headers });
    }
}