import { Injectable } from "@angular/core";
import { HttpClient,HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment.development";

import { tap } from "rxjs/operators"; // <--- Importante: Importar tap

// Interfaz para saber qué nos devuelve la API exactamente
export interface LoginResponse {
  response: string; // El Token
  role: string;
  idrole: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceTorneo{
     constructor(private _http:HttpClient){}
     //Login funcional del Torneo
    login(nombre: string,contraseña:string): Observable<LoginResponse> {
        let apiUrl=environment.apiTorneo+"api/auth/LoginEventos";
        let credentials={
            userName:nombre,
            password:contraseña
        }
        console.log(credentials);
        return this._http.post<LoginResponse>(apiUrl, credentials).pipe(
            tap((data: LoginResponse) => {
                //Capturamos la respuesta
                if (data.response) {
                //Guardamos el token
                localStorage.setItem('authToken', data.response);                
                //Guardamos el Rol
                localStorage.setItem('userRole', data.role);               
                //Guardamos el ID del Rol (lo convertimos a string para guardarlo)
                localStorage.setItem('userIdRole', data.idrole.toString());
                }
            })
            );
        };   
    
    getToken(): string | null {
    return localStorage.getItem('authToken');
    }

    getRole(): string | null {
    return localStorage.getItem('userRole');
    }

    getIdRole(): string | null {
        return localStorage.getItem('userIdRole');
    }

    cerrarSesion(): void{
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userIdRole");
        this.getToken();
    }


}