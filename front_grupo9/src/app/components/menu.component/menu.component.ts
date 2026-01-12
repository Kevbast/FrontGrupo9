import { Component, EventEmitter, Output } from '@angular/core';
import { ServiceTorneo } from '../../services/sercvice.torneo';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  standalone: false,
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
})
export class MenuComponent {

@Output()updateToken:EventEmitter<any>=new EventEmitter()//NO BORRAR

  constructor(private _service:ServiceTorneo,private _router:Router){}//NO BORRAR
  
  cerrarSesion():void{
    this._service.cerrarSesion();
    console.log("SESION CERRADA!")
    this.updateToken.emit();
  }
}
