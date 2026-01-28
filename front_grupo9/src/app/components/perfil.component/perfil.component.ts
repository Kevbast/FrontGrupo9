import { Component, OnInit } from '@angular/core';
import { Usuario } from '../../models/Usuario';
import { ServiceTorneo } from '../../services/service.torneo';
import { ActividadesService } from '../../services/service.actividad'; // IMPORT NECESARIO
import { Router } from '@angular/router';
import { ActividadUser } from '../../models/ActividadesUser';
import Swal from 'sweetalert2';

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
      this._service.getPerfil().subscribe({
        next: (response) => {
          this.user = response;
          console.log('👤 Perfil cargado:', response);
        },
        error: (err) => {
          console.error('Error al cargar perfil:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error al cargar perfil',
            text: 'No se pudo obtener la información de tu perfil. Por favor, intenta de nuevo.',
            confirmButtonColor: '#d33'
          });
        }
      });

      // 2. Cargar Actividades Inscritas
      this._service.getActividadesInscritas().subscribe({
        next: (data) => {
          this.actividades = data;
          this.loadingActividades = false;

          // Mensaje de bienvenida si tiene actividades
          if (data.length > 0) {
            Swal.fire({
              icon: 'success',
              title: '¡Bienvenido! 👋',
              text: `Estás inscrito en ${data.length} ${data.length === 1 ? 'competición' : 'competiciones'}.`,
              timer: 2500,
              showConfirmButton: false,
              toast: true,
              position: 'top-end'
            });
          }
        },
        error: (err) => {
          this.loadingActividades = false;
          
          Swal.fire({
            icon: 'warning',
            title: 'Error al cargar actividades',
            text: 'No se pudieron obtener tus inscripciones. Por favor, recarga la página.',
            confirmButtonColor: '#f39c12'
          });
        }
      });

    } else {
      // No hay token válido
      Swal.fire({
        icon: 'warning',
        title: 'Sesión no iniciada',
        text: 'Debes iniciar sesión para ver tu perfil.',
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Ir al login'
      }).then(() => {
        this._router.navigate(['/login']);
      });
    }
  }
  
  irAEvento(idEvento: number): void {
    this._router.navigate(['/activities', idEvento]);
  }
}