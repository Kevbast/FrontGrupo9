import { Component, OnInit } from '@angular/core';
import { Evento } from '../../models/Evento';
import { EventosService } from '../../services/eventosService';

@Component({
  selector: 'home-component',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  public eventos!: Array<Evento>

  constructor(private _service: EventosService){}

  ngOnInit(): void {
    this._service.getEventos().subscribe(result => {
      this.eventos = result;
    })
  }
}
