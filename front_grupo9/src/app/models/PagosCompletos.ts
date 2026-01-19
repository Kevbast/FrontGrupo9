export class PagosCompletos {
  constructor(
    public id: number,
    public idEvento: number,
    public fechaEvento: Date,
    public idEventoActividad: number,
    public idActividad: number,
    public actividad: string,
    public idPrecioActividad: number,
    public precioTotal: number,
    public idPago: number,
    public cantidadPagada: number,
    public idCurso: number,
    public curso: string,
    public estado: string,
  ) {}
}
