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
import { Evento } from "../models/Evento";

@Injectable()
export class EquiposService {
    
    constructor(private _http: HttpClient, private _serviceTorneo: ServiceTorneo){}

// -------- METODOS GET ---------------
//----------------------------------------

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('authToken');
        let headers = new HttpHeaders();
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    getTodosEquipos(): Observable<Array<Equipo>> {
        let request = "api/Equipos";
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.get<Array<Equipo>>(url, { headers: headers });
    }

    getEquiposActividadEvento(idActividad: number, idEvento: number): Observable<Array<Equipo>> {
        let request = "api/Equipos/EquiposActividadEvento/" + idActividad + "/" + idEvento;
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.get<Array<Equipo>>(url, { headers: headers });
    }
    getJugadoresEquipo(idEquipo: number): Observable<Array<Usuario>> {
        let request = "api/Equipos/UsuariosEquipo/" + idEquipo;
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.get<Array<Usuario>>(url, { headers: headers });
    }
    getMiembrosEquipo(): Observable<Array<MiembroEquipos>> {
        let request = "api/MiembroEquipos";
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<MiembroEquipos>>(url);
    }
    getCapitanByIdEventoActividad(idEventoActividad: number): Observable<Usuario> {
        let request = "api/CapitanActividades/FindCapitanEventoActividad/" + idEventoActividad;
        let url = environment.urlApiEventos + request;
        return this._http.get<Usuario>(url);
    }
    getCapitanes(): Observable<Array<CapitanActividad>> {
        let request = "api/CapitanActividades"
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<CapitanActividad>>(url);
    }

    getCursosActivos(): Observable<Array<Curso>> {
        let request = "api/GestionEvento/CursosActivos";
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.get<Array<Curso>>(url, { headers: headers });
    }

    getColores(): Observable<Array<Color>> {
        let request = "api/Colores";
        let url = environment.urlApiEventos + request;
        return this._http.get<Array<Color>>(url);
    }

    getColorById(idColor: number): Observable<Color> {
        let request = "api/Colores/" + idColor;
        let url = environment.urlApiEventos + request;
        const headers = this.getAuthHeaders();
        return this._http.get<Color>(url, { headers: headers });
    }

    getEventoActividad(idEvento: number, idActividad: number): Observable<any> {
        let request = "api/ActividadesEvento/FindIdEventoActividad/" + idEvento + "/" + idActividad;
        let url = environment.urlApiEventos + request;
        return this._http.get(url);
    }

    getEvento(idEvento: number): Observable<Evento> {
        let request = "api/Eventos/" + idEvento;
        let url = environment.urlApiEventos + request;
        return this._http.get<Evento>(url);
    }

    getInscripcionesQuiereCapitan(idEvento: number, idActividad: number): Observable<Array<Usuario>> {
        let request = "api/Inscripciones/InscripcionesUsuariosEventoCapitanActividad/" + idEvento;
        let url = environment.urlApiEventos + request + "?idActividad=" + idActividad;
        return this._http.get<Array<Usuario>>(url);
    }

    getInscripcionesEventoActividad(idEvento: number, idActividad: number): Observable<Array<Usuario>> {
        let request = "api/Inscripciones/InscripcionesUsuariosEventoActividad/" + idEvento;
        let url = environment.urlApiEventos + request + "?idActividad=" + idActividad;
        return this._http.get<Array<Usuario>>(url);
    }

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

//-------------- METODOS DE ACCION --------------------------------------------

    unirseEquipo(idEquipo: number): Observable<any> {
        let request = "api/UsuariosDeportes/ApuntarmeEquipo/" + idEquipo;
        let url = environment.urlApiEventos + request;
        let headers = new HttpHeaders();
        let token = this._serviceTorneo.getToken();
        headers = headers.set('Authorization', `Bearer ${token}`);
        return this._http.post(url, "", {headers: headers});
    }


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

    actualizarEquipo(equipoRecibido: Equipo): Observable<any> {
        let request = "api/Equipos/update";
        let url = environment.urlApiEventos + request;
        let headers = new HttpHeaders();
        let token = this._serviceTorneo.getToken();
        headers = headers.set('Authorization', `Bearer ${token}`);

        const equipo = {
            idEquipo: equipoRecibido.idEquipo,
            idEventoActividad: equipoRecibido.idEventoActividad,
            nombreEquipo: equipoRecibido.nombreEquipo,
            minimoJugadores: equipoRecibido.minimoJugadores,
            idColor: equipoRecibido.idColor,
            idCurso: equipoRecibido.idCurso
        }

        return this._http.put(url, equipo, {headers: headers});
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

    asignarCapitan(usuarioCapitan: CapitanActividad): Observable<any> {
        let request = "api/CapitanActividades/create";
        let url = environment.urlApiEventos + request;
        return this._http.post(url, usuarioCapitan);
    }


// ------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------

}
