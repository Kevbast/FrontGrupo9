import { Component } from '@angular/core';
import { Evento } from '../../../models/Evento';
import { EventosService } from '../../../services/eventosService';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {

  public eventos!: Array<Evento>
  public eventosDisponibles!: Array<Evento>
  public eventosTranscurridosMismoYear!: Array<Evento>

  constructor(private _service: EventosService){}

  ngOnInit(): void {
    this._service.getEventos().subscribe(result => {
      this.eventos = result;
      this.filtrarEventosDisponibles();
      this.filtrarEventosTranscurridosMismoYear();
    })
  }

  //METODO PARA OBTENER LOS EVENTOS DISPONIBLES PARA INSCRIBIRSE, ES DECIR, QUE SU FECHAEVENTO NO HAYA PASADO.
  filtrarEventosDisponibles(): void {
    const fechaActual = new Date();
    this.eventosDisponibles = this.eventos.filter(evento => {
      const fechaEvento = new Date(evento.fechaEvento);
      return fechaEvento >= fechaActual;
    });
  }

  //METODO PARA OBTENER LOS EVENTOS YA TRANSCURRIDOS EL MISMO AÑO
  filtrarEventosTranscurridosMismoYear(): void {
    const fechaActual = new Date();
    this.eventosTranscurridosMismoYear = this.eventos.filter(evento => {
      const fechaEvento = new Date(evento.fechaEvento);
      return fechaEvento < fechaActual && fechaEvento.getFullYear() == fechaActual.getFullYear()
    });
  }
}
