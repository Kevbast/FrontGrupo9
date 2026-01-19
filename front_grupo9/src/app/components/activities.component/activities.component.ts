import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActividadesService } from '../../services/service.actividad';
import { InscripcionesService } from '../../services/service.inscripciones';
import { MaterialesService } from '../../services/materialesService';
import { MatDialog } from '@angular/material/dialog';
import { Actividad } from '../../models/Actividad';
import { Inscripcion } from '../../models/Inscripcion';
import { Material } from '../../models/Material';
import { Usuario } from '../../models/Usuario';
import { ServiceTorneo } from '../../services/service.torneo';

@Component({
  selector: 'app-activities',
  standalone: false,
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css',
})
export class ActivitiesComponent implements OnInit {
  
  public actividadesEvento!: Array<Actividad>;
  public inscripciones: Inscripcion[] = [];
  public inscripcionesPorActividad: { [key: number]: Inscripcion[] } = {};
  public materialesEventoActividad!: Array<Material>;
  public mostrarModal: boolean = false;
  public actividadSeleccionada: string = '';
  public mostrarModalInscripcion: boolean = false;
  public mostrarModalCrearActividad: boolean = false;
  public mostrarModalEditarActividad: boolean = false;
  public mostrarModalError: boolean = false;
  public mensajeError: string = '';
  public idEvento!: number;
  public role: string | null = null;
  public idUsuarioActual: number = 0;
  public idEventoActividadSeleccionada: number = 0;

  public participantesCache: { [idActividad: number]: Usuario[] } = {};
  public actividadAbierta: number | null = null;
  public loadingLista: boolean = false;

  public inscripcion: Inscripcion;
  public actividadNueva: Actividad;
  public actividadEditar: Actividad;

  constructor(
    private actividadesService: ActividadesService, 
    private materialesService: MaterialesService,
    private inscripcionesService: InscripcionesService,
    private route: ActivatedRoute,
    private torneoService: ServiceTorneo,
    private dialog: MatDialog
  ) {
    this.inscripcion = new Inscripcion(0, 0, 0, false, new Date().toISOString());
    this.actividadNueva = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
    this.actividadEditar = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
  }

  ngOnInit(): void {
    this.torneoService.getPerfil().subscribe({
      next: (usuario) => {
        this.role = usuario.role;
        this.idUsuarioActual = usuario.idUsuario;
      },
      error: (err) => {
      }
    });
    
    this.route.params.subscribe(params => {
      this.idEvento = +params['idEvento'];
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.inscripcionesService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.agruparInscripcionesPorActividad();
      },
      error: (err) => {}
    });

    this.actividadesEvento = [];
    
    this.actividadesService.getActividadesEvento(this.idEvento).subscribe({
      next: (data) => {
        const actividadesActualizadas = data.map((act: any) => {
          return new Actividad(
            act.posicion || 0,
            act.idEvento || 0,
            act.fechaEvento || '',
            act.idProfesor || 0,
            act.idActividad || 0,
            act.nombreActividad || act.nombre || '',
            act.minimoJugadores || 0,
            act.idEventoActividad || 0
          );
        });
        
        this.actividadesEvento = actividadesActualizadas;
      },
      error: (err) => {}
    })
  }

  agruparInscripcionesPorActividad(): void {
    this.inscripcionesPorActividad = {};
    this.inscripciones.forEach(inscripcion => {
      if (!this.inscripcionesPorActividad[inscripcion.idEventoActividad]) {
        this.inscripcionesPorActividad[inscripcion.idEventoActividad] = [];
      }
      this.inscripcionesPorActividad[inscripcion.idEventoActividad].push(inscripcion);
    });
  }

  getInscripciones(idEventoActividad: number): Inscripcion[] {
    return this.inscripcionesPorActividad[idEventoActividad] || [];
  }

  getNumeroParticipantes(idEventoActividad: number): number {
    return this.getInscripciones(idEventoActividad).length;
  }

  toggleParticipantes(idEvento: number, idActividad: number): void {
    if (this.actividadAbierta === idActividad) {
      this.actividadAbierta = null;
      return;
    }

    this.actividadAbierta = idActividad;

    if (!this.participantesCache[idActividad]) {
      this.loadingLista = true;
      
      const inscripcionesActividad = this.getInscripciones(idActividad);
      const usuariosIds = inscripcionesActividad.map(insc => insc.idUsuario);
      
      this.inscripcionesService.getUsuariosPorInscripcion(usuariosIds).subscribe({
        next: (users) => {
          this.participantesCache[idActividad] = users;
          this.loadingLista = false;
        },
        error: (err) => {
          this.loadingLista = false;
        }
      });
    }
  }

  getMaterialesEventoActividad(idEventoActividad: number, nombreActividad: string): void {
    this.actividadSeleccionada = nombreActividad;
    this.materialesService.getMaterialesEvento(idEventoActividad).subscribe(result => {
      this.materialesEventoActividad = result;
      this.mostrarModal = true;
    })
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.materialesEventoActividad = [];
  }

  abrirModalInscripcion(idEventoActividad: number): void {
    this.idEventoActividadSeleccionada = idEventoActividad;
    this.inscripcion.idUsuario = this.idUsuarioActual;
    this.inscripcion.idEventoActividad = idEventoActividad;
    this.mostrarModalInscripcion = true;
  }

  cerrarModalInscripcion(): void {
    this.mostrarModalInscripcion = false;
    this.inscripcion = new Inscripcion(0, 0, 0, false, new Date().toISOString());
  }

  abrirModalCrearActividad(): void {
    this.mostrarModalCrearActividad = true;
  }

  cerrarModalCrearActividad(): void {
    this.mostrarModalCrearActividad = false;
    this.actividadNueva = new Actividad(0, this.idEvento, new Date().toISOString(), 0, 0, '', 0, 0);
  }

  crearActividadEnviar(): void {
    const actividadEnvio = new Actividad(
      this.actividadNueva.posicion,
      this.idEvento,
      new Date().toISOString(),
      this.actividadNueva.idProfesor,
      0,
      this.actividadNueva.nombreActividad,
      this.actividadNueva.minimoJugadores,
      0
    );
    
    this.actividadesService.crearActividad(actividadEnvio).subscribe({
      next: (respuesta) => {
        this.actividadesService.crearEventoActividad(this.idEvento, respuesta.idActividad).subscribe({
          next: (eventoActividadRespuesta) => {
            this.cerrarModalCrearActividad();
            setTimeout(() => {
              this.cargarDatos();
            }, 500);
          },
          error: (err) => {
            this.cerrarModalCrearActividad();
            setTimeout(() => {
              this.cargarDatos();
            }, 500);
          }
        });
      },
      error: (err) => {
      }
    });
  }

  crearActividad(): void {
    if (!this.esAdminOOrganizador()) {
      return;
    }
    this.actividadNueva = new Actividad(0, this.idEvento, new Date().toISOString(), 0, 0, '', 0, 0);
    this.mostrarModalCrearActividad = true;
  }

  editarActividad(actividad: Actividad): void {
    if (!this.esAdminOOrganizador()) {
      return;
    }
    this.actividadEditar = new Actividad(
      actividad.posicion,
      actividad.idEvento,
      actividad.fechaEvento,
      actividad.idProfesor,
      actividad.idActividad,
      actividad.nombreActividad,
      actividad.minimoJugadores,
      actividad.idEventoActividad
    );
    this.mostrarModalEditarActividad = true;
  }

  cerrarModalEditarActividad(): void {
    this.mostrarModalEditarActividad = false;
    this.actividadEditar = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
  }

  guardarCambiosActividad(): void {
    this.actividadesService.actualizarActividad(this.actividadEditar).subscribe({
      next: (respuesta) => {
        this.cerrarModalEditarActividad();
        
        setTimeout(() => {
          this.cargarDatos();
        }, 500);
      },
      error: (err) => {
      }
    });
  }

  public esAdminOOrganizador(): boolean {
    return this.role === 'ADMINISTRADOR' || this.role === 'ORGANIZADOR';
  }

  public cerrarModalError(): void {
    this.mostrarModalError = false;
    this.mensajeError = '';
  }

  public enviarInscripcion(): void {
    const actividadesDelEvento = this.actividadesEvento.map(act => act.idEventoActividad);
    const yaInscrito = this.inscripciones.some(insc => 
      insc.idUsuario === this.idUsuarioActual && 
      actividadesDelEvento.includes(insc.idEventoActividad)
    );

    if (yaInscrito) {
      this.mensajeError = 'Solo se puede inscribir en una actividad por evento';
      this.mostrarModalError = true;
      this.cerrarModalInscripcion();
      return;
    }

    this.inscripcionesService.crearInscripcion(this.inscripcion).subscribe({
      next: (respuesta) => {
        this.cerrarModalInscripcion();
        if (this.participantesCache[this.idEventoActividadSeleccionada]) {
          delete this.participantesCache[this.idEventoActividadSeleccionada];
        }
        setTimeout(() => {
          this.cargarDatos();
        }, 500);
      },
      error: (err) => {
        console.error('Error al crear inscripción:', err);
        this.cerrarModalInscripcion();
      }
    });
  }


}