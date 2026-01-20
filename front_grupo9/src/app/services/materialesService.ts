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

    crearMaterial(material: Material): Observable<any> {
        const url = `${environment.urlApiEventos}api/Materiales/create`;
        return this._http.post(url, material);
    }

    updateMaterial(material: Material): Observable<any> {
        const url = `${environment.apiTorneo}api/Materiales/update`; 
        return this._http.put(url, material);
    }

    aportarMaterial(idMaterial: number,idUsuarioAportacion:number): Observable<any> {
        let request = "api/Materiales/AportarMaterial/" + idMaterial+"/"+ idUsuarioAportacion; 
        let url = environment.urlApiEventos + request;
        return this._http.put(url,"");
    }

    deleteMateriales(idMaterial: number): Observable<any> {
        let request = "api/Materiales/" + idMaterial; 
        let url = environment.urlApiEventos + request;
        return this._http.delete(url);
    }   
   
}
