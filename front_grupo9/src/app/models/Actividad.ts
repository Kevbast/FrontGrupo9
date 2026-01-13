import { Inscripcion } from "./Inscripcion";

export class Actividad {
    constructor(
        public idEventoActividad: number,
        public nombre: string,
        public descripcion: string,
        public max: number,
        public materiales?: number,
        public actual?: number,
        public inscripciones?: Inscripcion[]
    ){}
}