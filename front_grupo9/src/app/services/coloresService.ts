import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment.development";
import { Color } from "../models/Color";

@Injectable()
export class ColoresService {
    constructor(private _http: HttpClient){}

    getAllColores(): Observable<Array<Color>> {
        let request = "api/Colores";
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Color>>(url);
    }

    createColor(nombre: string): Observable<any> {
        let request = "api/Colores/create/" + nombre;
        let url = environment.urlApiEventos + request;
        return this._http.post(url, "");
    }

    deleteColor(idColor: number): Observable<any> {
        let request = "api/Colores/" + idColor;
        let url = environment.urlApiEventos + request;
        return this._http.delete(url);
    }
}