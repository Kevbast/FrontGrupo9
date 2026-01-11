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

// Variable para controlar la animación del botón (Cargando...)
  public isLoading: boolean = false;
  public errorMessage: string = "";

 constructor(private _service: ServiceTorneo, private _app: App, private _router: Router) { }

 login(): void{
    let usuario = this.cajaUsername.nativeElement.value;
    let password = this.cajaPassword.nativeElement.value;

    if(!usuario || !password) {
      this.errorMessage = "Por favor, rellena todos los campos";
      return;
    }

    // this._service.login(usuario,password).subscribe(response=>{
    //       localStorage.setItem('authToken', response.response);
    //       console.log('Token JWT almacenado:', response.response);
    //       console.log('Idrole almacenado:', response.idrole);
    //       console.log('ROL almacenado:', response.role);
    //       this.isLoading = false;         
    //       this.updateToken.emit();
    //       this._router.navigate(["/"])
    // })
    this._service.login(usuario, password).subscribe({
      next: (response) => {
        localStorage.setItem('authToken', response.response);
        console.log('Login OK');       
        // 2. DESACTIVAR CARGA Y REDIRIGIR
        this.isLoading = false;         
        this.updateToken.emit();
        this._router.navigate(["/"]);
      },
      error: (error) => {
        console.error(error);
        this.errorMessage = "Credenciales incorrectas o error de servidor";
        // 3. IMPORTANTE: DESACTIVAR CARGA EN ERROR
        this.isLoading = false; 
      }
    });
  }

}
