import { Component, OnInit } from '@angular/core';
import { Curso } from '../../models/Curso';
import { UsuariosCurso } from '../../models/UsuariosCurso';
import { Usuario } from '../../models/Usuario';
// Importa tu modelo de Actividades (asegúrate que el nombre coincide con tu archivo)
import { Actividad } from '../../models/Actividad'; 
import { ServiceTorneo } from '../../services/service.torneo';
import { ActividadesService } from '../../services/service.actividad'; // <--- IMPORTADO
import { Router } from '@angular/router';
import { Actividades } from '../../models/Actividades';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  // --- TAB 1: USUARIOS ---
  public cursos: Curso[] = [];
  public usuarios: UsuariosCurso[] = [];
  public idCursoSeleccionado: number = 0;
  public loading: boolean = false;
  public adminUser: Usuario | null = null;

  // --- TAB 2: ACTIVIDADES ---
  public listaActividades: Actividades[] = [];
  public loadingActividades: boolean = false;
  public mostrandoFormulario: boolean = false;
  public esEdicion: boolean = false;
  public actividadForm: Actividades = new Actividades(0, '', 0);

  // Columnas de la tabla
  public displayedColumns: string[] = ['id', 'nombre', 'minJugadores', 'acciones'];

  constructor(
    private _service: ServiceTorneo,
    private _router: Router
  ) { }

  ngOnInit(): void {
    this._service.getPerfil().subscribe({
      next: (user) => {
        this.adminUser = user;
        if (user.idRole !== 3 && user.idRole !==4 ) {//
          this._router.navigate(['/perfil']);
        } else {
          this.cargarCursos();
          this.cargarActividades();
        }
      },
      error: () => this._router.navigate(['/login'])
    });
  }

  // --- LÓGICA USUARIOS ---
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
    if (confirm(`¿Hacer ORGANIZADOR a ${usuario.usuario}?`)) {
      this._service.asignarRolOrganizador(usuario.idUsuario).subscribe({
        next: () => {
          usuario.idRole = 4;
          usuario.role = 'ORGANIZADOR';
          alert(`✅ ${usuario.usuario} ahora es Organizador.`);
        },
        error: () => alert("❌ Error al asignar rol.")
      });
    }
  }

  // --- LÓGICA ACTIVIDADES (CRUD) ---
  cargarActividades() {
    this.loadingActividades = true;
    this._service.getActividades().subscribe({
      next: (data) => {
        this.listaActividades = data;
        this.loadingActividades = false;
      },
      error: (e) => {
        console.error(e);
        this.loadingActividades = false;
      }
    });
  }

  mostrarFormularioCrear() {
    this.actividadForm = new Actividades(0, '', 0);
    this.esEdicion = false;
    this.mostrandoFormulario = true;
  }

  editarActividad(act: Actividades) {
    this.actividadForm = new Actividades(act.idActividad, act.nombre, act.minimoJugadores);
    this.esEdicion = true;
    this.mostrandoFormulario = true;
  }

  cancelarFormulario() {
    this.mostrandoFormulario = false;
  }

  guardarActividad() {
    if (!this.actividadForm.nombre) {
      alert("El nombre es obligatorio");
      return;
    }

    if (this.esEdicion) {
      this._service.actualizarActividad(this.actividadForm).subscribe({
        next: () => {
          alert('✅ Actividad actualizada');
          this.mostrandoFormulario = false;
          this.cargarActividades();
        },
        error: () => alert('❌ Error al actualizar')
      });
    } else {
      this._service.crearActividad(this.actividadForm).subscribe({
        next: () => {
          alert('✅ Actividad creada');
          this.mostrandoFormulario = false;
          this.cargarActividades();
        },
        error: () => alert('❌ Error al crear')
      });
    }
  }

  borrarActividad(id: number) {
    if (confirm('¿Eliminar esta actividad permanentemente?')) {
      this._service.deleteActividad(id).subscribe({
        next: () => {
          this.cargarActividades();
        },
        error: () => alert('❌ Error al eliminar')
      });
    }
  }
}