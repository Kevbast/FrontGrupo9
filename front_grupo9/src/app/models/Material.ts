export class Material {
    constructor (
        public idMaterial: number,
        public idEventoActividad: number,
        public idUsuario: number,
        public nombreMaterial: string,
        public pendiente: true,
        public fechaSolicitud: string,
        public idUsuarioAportacion: number
    ){}
}