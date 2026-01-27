import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../models/Usuario';
import { ServiceTorneo } from '../../services/service.torneo';
import { ActividadesService } from '../../services/service.actividad'; // IMPORT NECESARIO
import { Router } from '@angular/router';
import { ActividadUser } from '../../models/ActividadesUser';

@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent implements OnInit {
  public user!: Usuario;
  public actividades: ActividadUser[] = []; 
  public loadingActividades: boolean = true;

  constructor(
    private _service: ServiceTorneo, 
    private _router: Router
  ) {}

  ngOnInit(): void {
    if (this._service.getToken()) {
      // 1. Cargar Perfil
      this._service.getPerfil().subscribe((response) => {
        this.user = response;
      });

      // 2. Cargar Actividades Inscritas
      // Usamos el servicio de actividades inyectado
      this._service.getActividadesInscritas().subscribe({
        next: (data) => {
          this.actividades = data;
          this.loadingActividades = false;
        },
        error: (err) => {
          console.error(err);
          this.loadingActividades = false;
        }
      });

    } else {
      this._router.navigate(['/login']);
    }
  }
  
  irAEvento(idEvento: number): void {
    this._router.navigate(['/activities', idEvento]);
  }
}