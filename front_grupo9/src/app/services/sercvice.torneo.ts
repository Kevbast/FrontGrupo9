import { Injectable } from "@angular/core";
import { HttpClient,HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment.development";

@Injectable({
  providedIn: 'root'
})
export class ServiceTorneo{
     constructor(private _http:HttpClient){}
     //Login funcional del Torneo
    login(nombre: string,contraseña:string): Observable<any> {
        let apiUrl=environment.apiTorneo+"api/auth/LoginEventos";
        let credentials={
            userName:nombre,
            password:contraseña
        }
        console.log(credentials);
        return this._http.post<any>(apiUrl, credentials);   
    }
    getToken(): string | null {
    return localStorage.getItem('authToken');
    }

    cerrarSesion(): void{
        localStorage.removeItem("authToken");
        this.getToken();
    }


}