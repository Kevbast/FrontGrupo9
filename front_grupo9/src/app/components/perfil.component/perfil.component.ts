import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../models/Usuario';
import { ServiceTorneo } from '../../services/service.torneo';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  public user!: Usuario;

  constructor(private _service: ServiceTorneo, private _router: Router) {}

  ngOnInit(): void {
    if (this._service.getToken()) {
      this._service.getPerfil().subscribe((response) => {
        this.user = response;

        console.log(this.user);
        console.log('ROL DEL USUARIO: ' + this.user.role);
        console.log('Curso:' + this.user.curso);
        console.log(this.user.imagen);
      });
    } else {
      this._router.navigate(['/login']);
    }
  }
}
