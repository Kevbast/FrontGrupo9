import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Evento } from "../models/Evento";
import { environment } from "../environments/environment.development";

@Injectable()
export class EventosService {
    constructor(private _http: HttpClient){}

    getEventos(): Observable<Array<Evento>> {
        let request = "api/Eventos"
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Evento>>(url);
    }
}