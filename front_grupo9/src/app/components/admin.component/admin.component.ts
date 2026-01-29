import { Component, OnInit } from '@angular/core';
import { Curso } from '../../models/Curso';
import { UsuariosCurso } from '../../models/UsuariosCurso';
import { Usuario } from '../../models/Usuario';
import { Actividad } from '../../models/Actividad'; 
import { ServiceTorneo } from '../../services/service.torneo';
import { ActividadesService } from '../../services/service.actividad'; 
import { Router } from '@angular/router';
import { Actividades } from '../../models/Actividades';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  
  // VARIABLES
  public cursos: Curso[] = [];
  public usuarios: UsuariosCurso[] = [];
  public idCursoSeleccionado: number = 0;
  public loading: boolean = false;
  public adminUser: Usuario | null = null; // El usuario que está logueado

  public listaActividades: Actividades[] = [];
  public loadingActividades: boolean = false;
  public mostrandoFormulario: boolean = false;
  public esEdicion: boolean = false;
  public actividadForm: Actividades = new Actividades(0, '', 0);

  public displayedColumns: string[] = ['id', 'nombre', 'minJugadores', 'acciones'];

  constructor(
    private _service: ServiceTorneo,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this._service.getPerfil().subscribe({
      next: (user) => {
        this.adminUser = user;
        
        // RESTRICCIÓN DE ACCESO A LA VISTA
        // Solo entran Admin (3) y Organizador (4) y (6)
        if (user.idRole !== 3 && user.idRole !== 4 && user.idRole !== 6) {
          this._router.navigate(['/perfil']);
        } else {
          this.cargarCursos();
          this.cargarActividades();
        }
      },
      error: () => this._router.navigate(['/login'])
    });
  }

  // ... (cargarCursos y cargarUsuarios igual) ...
  cargarCursos() {
    this._service.getCursosActivos().subscribe(data => this.cursos = data);
  }

  cargarUsuarios() {
    if (!this.idCursoSeleccionado) return;
    this.loading = true;
    this.usuarios = [];
    this._service.getUsuariosPorCurso(this.idCursoSeleccionado).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  ascenderAOrganizador(usuario: UsuariosCurso) {
    // Doble seguridad: Si no es Admin (3), no hace nada.
    if (this.adminUser?.idRole !== 3) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'No tienes permisos para realizar esta acción.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    Swal.fire({
      title: '¿Ascender a Organizador?',
      text: `¿Deseas hacer ORGANIZADOR a ${usuario.usuario}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, ascender',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this._service.asignarRolOrganizador(usuario.idUsuario).subscribe({
          next: () => {
            usuario.idRole = 4;
            usuario.role = 'ORGANIZADOR';
            Swal.fire({
              icon: 'success',
              title: '¡Ascendido!',
              text: `${usuario.usuario} ahora es Organizador.`,
              timer: 2500,
              showConfirmButton: false
            });
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo asignar el rol. Inténtalo de nuevo.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  // ... (cargarActividades igual) ...
  cargarActividades() {
    this.loadingActividades = true;
    this._service.getActividades().subscribe({
      next: (data) => {
        this.listaActividades = data;
        this.loadingActividades = false;
      },
      error: (e) => {
        this.loadingActividades = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar actividades',
          text: 'No se pudieron obtener las actividades. Por favor, recarga la página.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  // --- AQUÍ ESTÁ EL ARREGLO DEL SCROLL ---

  mostrarFormularioCrear() {
    this.actividadForm = new Actividades(0, '', 0);
    this.esEdicion = false;
    this.mostrandoFormulario = true;
    
    // Subir suavemente al formulario
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  }

  editarActividad(act: Actividades) {
    this.actividadForm = new Actividades(act.idActividad, act.nombre, act.minimoJugadores);
    this.esEdicion = true;
    this.mostrandoFormulario = true;

    // MAGIA: Hace scroll hacia arriba suavemente para ver el formulario
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Opcional: Si quieres ir a un elemento específico:
        // document.getElementById('topForm')?.scrollIntoView({ behavior: 'smooth' });
    }, 100); 
  }

  // ... (resto de funciones guardar/borrar igual) ...
  cancelarFormulario() {
    this.mostrandoFormulario = false;
  }

  guardarActividad() {
    if (!this.actividadForm.nombre) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos incompletos',
        text: 'El nombre de la actividad es obligatorio',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    if (this.esEdicion) {
      this._service.actualizarActividad(this.actividadForm).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Actualizado!',
            text: 'Actividad actualizada correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.mostrandoFormulario = false;
          this.cargarActividades();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo actualizar la actividad',
            confirmButtonColor: '#d33'
          });
        }
      });
    } else {
      this._service.crearActividad(this.actividadForm).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Creado!',
            text: 'Actividad creada correctamente',
            timer: 2000,
            showConfirmButton: false
          });
          this.mostrandoFormulario = false;
          this.cargarActividades();
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear la actividad',
            confirmButtonColor: '#d33'
          });
        }
      });
    }
  }

  borrarActividad(id: number) {
    Swal.fire({
      title: '¿Eliminar actividad?',
      text: 'Esta acción eliminará la actividad permanentemente',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this._service.deleteActividad(id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'La actividad ha sido eliminada',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarActividades();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar la actividad',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }
}