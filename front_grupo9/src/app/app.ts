import { Component, signal } from '@angular/core';
import { ServiceTorneo } from './services/service.torneo';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('front_grupo9');

  //Situamos el update en app 
  public token: string |null = null;
  
  constructor(private _service:ServiceTorneo) {
    this.updateToken()
   }
    
   updateToken(): void {
    this.token = this._service.getToken();
    console.log("Token vista app: "+this._service.getToken())
  }

}
