import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Material } from '../models/Material';
import { environment } from '../../environments/environment.development';

@Injectable()
export class MaterialesService {
    constructor(private _http: HttpClient){}

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('authToken');
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    getMaterialesEvento(idEventoActividad: number): Observable<Array<Material>> {
        let request = "api/Materiales/MaterialesActividad/" + idEventoActividad; 
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.get<Array<Material>>(url, { headers: headers });
    }

    crearMaterial(material: Material): Observable<any> {
        const url = `${environment.urlApiEventos}api/Materiales/create`;
        const headers = this.getAuthHeaders();
        return this._http.post(url, material, { headers: headers });
    }

    updateMaterial(material: Material): Observable<any> {
        const url = `${environment.apiTorneo}api/Materiales/update`;
        const headers = this.getAuthHeaders(); 
        return this._http.put(url, material, { headers: headers });
    }

    aportarMaterial(idMaterial: number,idUsuarioAportacion:number): Observable<any> {
        let request = "api/Materiales/AportarMaterial/" + idMaterial+"/"+ idUsuarioAportacion; 
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.put(url,"", { headers: headers });
    }

    deleteMateriales(idMaterial: number): Observable<any> {
        let request = "api/Materiales/" + idMaterial; 
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.delete(url, { headers: headers });
    }   
   
}
