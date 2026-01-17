export class Inscripcion {
    constructor(
        public idInscripcion: number,
        public idUsuario: number,
        public idEventoActividad: number,
        public quiereSerCapitan: boolean,
        public fechaInscripcion: string,
        public nombre?: string,
        public eventoId?: number
    ){}
}