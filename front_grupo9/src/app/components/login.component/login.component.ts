import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { ServiceTorneo } from '../../services/service.torneo';
import { App } from '../../app';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
@ViewChild('cajausername') cajaUsername!: ElementRef;
@ViewChild('cajapassword') cajaPassword!: ElementRef;
@Output()updateToken:EventEmitter<any>=new EventEmitter()

 constructor(private _service: ServiceTorneo, private _app: App, private _router: Router) { }

 login(): void{
    let usuario = this.cajaUsername.nativeElement.value;
    let password = this.cajaPassword.nativeElement.value;

    this._service.login(usuario,password).subscribe(response=>{
          localStorage.setItem('authToken', response.response);
          console.log('Token JWT almacenado:', response.response);
          this.updateToken.emit();
          this._router.navigate(["/"])
    })
  }

}
