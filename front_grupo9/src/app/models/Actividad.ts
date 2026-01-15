import { Inscripcion } from "./Inscripcion";

export class Actividad {
    constructor(
        public posicion: number,
        public idEvento: number,
        public fechaEvento: string,
        public idProfesor: number,
        public idActividad: number,
        public nombreActividad: string,
        public minimoJugadores: number,
        public idEventoActividad: number
    ){}
}