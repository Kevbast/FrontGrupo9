import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Material } from '../models/Material';
import { environment } from '../../environments/environment.development';

@Injectable()
export class MaterialesService {
    constructor(private _http: HttpClient){}
    getMaterialesEvento(idEventoActividad: number): Observable<Array<Material>> {
        let request = "api/Materiales/MaterialesActividad/" + idEventoActividad; 
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Material>>(url);
    }
}
