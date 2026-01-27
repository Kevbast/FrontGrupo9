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

// 1. NUEVA VARIABLE PARA EL OJO
  public hidePassword: boolean = true;

// Variable para controlar la animación del botón (Cargando...)
  public isLoading: boolean = false;
  public errorMessage: string = "";

 constructor(private _service: ServiceTorneo, private _app: App, private _router: Router) { }

 login(): void{
    let usuarioInput = this.cajaUsername.nativeElement.value;
    let password = this.cajaPassword.nativeElement.value;

    if(!usuarioInput || !password) {
      this.errorMessage = "Por favor, rellena todos los campos";
      return;
    }
    
    let usuarioCompleto = usuarioInput + '@tajamar365.com';

    this._service.login(usuarioCompleto, password).subscribe({
      next: (response) => {
        localStorage.setItem('authToken', response.response);
        // 2. DESACTIVAR CARGA Y REDIRIGIR
        this.isLoading = false;         
        this.updateToken.emit();
        this._router.navigate(["/"]);
      },
      error: (error) => {
        this.errorMessage = "Credenciales incorrectas o error de servidor";
        // 3. IMPORTANTE: DESACTIVAR CARGA EN ERROR
        this.isLoading = false; 
      }
    });
  }

}
