
export class ActividadUser {
    constructor(
        public id: number,
        public idEvento: number,
        public fechaEvento: string,
        public idActividad: number,
        public nombreActividad: string,
        public idEventoActividad: number,
        public idUsuario: number,
        public quiereSerCapitan: boolean,
        public fechaInscripcion: string
    ){}
}