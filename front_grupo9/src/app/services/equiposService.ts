import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Equipo } from "../models/Equipo";
import { environment } from "../../environments/environment.development";
import { Usuario } from "../models/Usuario";
import { Curso } from "../models/Curso";
import { Color } from "../models/Color";
import { CapitanActividad } from "../models/CapitanActividad";
import { MiembroEquipos } from "../models/MiembrosEquipo";
import { ServiceTorneo } from "./service.torneo";

@Injectable()
export class EquiposService {
    
    constructor(private _http: HttpClient, private _serviceTorneo: ServiceTorneo){}

// -------- METODOS GET ---------------
//----------------------------------------

    getEquiposActividadEvento(idActividad: number, idEvento: number): Observable<Array<Equipo>> {
        let request = "api/Equipos/EquiposActividadEvento/" + idActividad + "/" + idEvento;
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Equipo>>(url);
    }
    getJugadoresEquipo(idEquipo: number): Observable<Array<Usuario>> {
        let request = "api/Equipos/UsuariosEquipo/" + idEquipo;
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Usuario>>(url);
    }
    getMiembrosEquipo(): Observable<Array<MiembroEquipos>> {
        let request = "api/MiembroEquipos";
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<MiembroEquipos>>(url);
    }
    getCapitanes(): Observable<Array<CapitanActividad>> {
        let request = "api/CapitanActividades"
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<CapitanActividad>>(url);
    }

    getCursosActivos(): Observable<Array<Curso>> {
        let request = "api/GestionEvento/CursosActivos";
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Curso>>(url);
    }

    getColores(): Observable<Array<Color>> {
        let request = "api/Colores";
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Color>>(url);
    }

    getColorById(idColor: number): Observable<Color> {
        let request = "api/Colores/" + idColor;
        let url = environment.urlApiEventos + request;
        return this._http.get<Color>(url);
    }

    getEventoActividad(idEvento: number, idActividad: number): Observable<any> {
        let request = "api/ActividadesEvento/FindIdEventoActividad/" + idEvento + "/" + idActividad;
        let url = environment.urlApiEventos + request;
        return this._http.get(url);
    }

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

//-------------- METODOS DE ACCION --------------------------------------------

    createEquipo(equipoRecibido: Equipo) : Observable<any> {
        let request = "api/Equipos/create";
        let url = environment.urlApiEventos + request;
        let headers = new HttpHeaders();
        let token = this._serviceTorneo.getToken();
        headers = headers.set('Authorization', `Bearer ${token}`);

        const equipo = {
            idEquipo: 0,
            idEventoActividad: equipoRecibido.idEventoActividad || '',
            nombreEquipo: equipoRecibido.nombreEquipo || '',
            minimoJugadores: equipoRecibido.minimoJugadores || 0,
            idColor: equipoRecibido.idColor || 0,
            idCurso: equipoRecibido.idCurso || 0
        }

        return this._http.post(url, equipo, {headers: headers});
    }

    eliminarEquipo(idEquipo: number): Observable<any> {
        let request = "api/Equipos/" + idEquipo;
        let url = environment.urlApiEventos + request;
        let headers = new HttpHeaders();
        let token = this._serviceTorneo.getToken();
        headers = headers.set('Authorization', `Bearer ${token}`);
        return this._http.delete(url, {headers: headers});
    }

    eliminarMiembroEquipo(idMiembroEquipo: number): Observable<any> {
        let request = "api/MiembroEquipos/" + idMiembroEquipo;
        let url = environment.urlApiEventos + request;
        let headers = new HttpHeaders();
        let token = this._serviceTorneo.getToken();
        headers = headers.set('Authorization', `Bearer ${token}`);
        return this._http.delete(url, {headers: headers});
    }
    //METODO QUE SOLO USA EL CAPITAN PARA APUNTAR A PARTICIPANTES A UN EQUIPO
    apuntarParticipante(idUsuario: number, idEquipo: number): Observable<any> {
        let request = "api/MiembroEquipos/create/" + idUsuario + "/" + idEquipo
        let url = environment.urlApiEventos + request;
        return this._http.post(url, "");
    }

    crearColor(nombreColor: string): Observable<any> {
        let request = "api/Colores/create/" + nombreColor;
        let url = environment.urlApiEventos + request;
        return this._http.post(url, "");
    }


// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

}
