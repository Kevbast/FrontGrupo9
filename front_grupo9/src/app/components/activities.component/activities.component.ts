import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ActividadesService } from '../../services/service.actividad';
import { ServiceTorneo } from '../../services/service.torneo';

import { InscripcionesService } from '../../services/service.inscripciones';
import { Inscripcion } from '../../models/Inscripcion';
import { Actividad } from '../../models/Actividad';
import { Material } from '../../models/Material';
import { MaterialesService } from '../../services/materialesService';

@Component({
  selector: 'app-activities',
  standalone: false,
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css',
})
export class ActivitiesComponent implements OnInit {
  public actividades: Actividad[] = [];
  public actividadesEvento!: Array<Actividad>;
  public inscripciones: Inscripcion[] = [];
  public inscripcionesPorActividad: { [key: number]: Inscripcion[] } = {};
  public materialesEventoActividad!: Array<Material>;
  public mostrarModal: boolean = false;
  public actividadSeleccionada: string = '';
  public idEvento!: number;
  public role: string | null = null;

  constructor(
    private actividadesService: ActividadesService, 
    private materialesService: MaterialesService,
    private inscripcionesService: InscripcionesService,
    private route: ActivatedRoute,
    private torneoService: ServiceTorneo
  ) {}

  ngOnInit(): void {
    // Obtener el rol del usuario
    this.torneoService.getPerfil().subscribe(usuario => {
      this.role = usuario.role;
    });
    
    // Obtener el idEvento de los parámetros de la ruta
    this.route.params.subscribe(params => {
      this.idEvento = +params['idEvento']; // El + convierte string a number
      console.log('ID Evento recibido:', this.idEvento);
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.inscripcionesService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.agruparInscripcionesPorActividad();
        
        console.log('Inscripciones cargadas:', this.inscripciones);
        console.log('Inscripciones por actividad:', this.inscripcionesPorActividad);
      },
      error: (err) => console.error('Error cargando inscripciones:', err)
    });

    //Cargar actividades por evento de la API
    this.actividadesService.getActividadesEvento(this.idEvento).subscribe({
      next: (data) => {
        console.log('Actividades del evento cargadas:', data);
        // Asignar directamente a actividadesEvento con el mapeo del modelo
        this.actividadesEvento = data.map(act => {
          return new Actividad(
            act.posicion || 0,
            act.idEvento || 0,
            act.fechaEvento || '',
            act.idProfesor || 0,
            act.idActividad || 0,
            act.nombreActividad || '',
            act.minimoJugadores || 0,
            act.idEventoActividad || 0
          );
        });
        console.log('actividadesEvento procesadas:', this.actividadesEvento);
      },
      error: (err) => console.error('Error cargando actividades del evento:', err)
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

  //OBTENER LOS MATERIALES DEL EVENTO/ACTIVIDAD (MARCOS)
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

  crearActividad(): void {
    if (!this.esAdminOOrganizador()) {
      console.log('No tienes permisos para crear actividades');
      return;
    }
    console.log('Crear nueva actividad');
    // Aquí puedes añadir la lógica para abrir un modal o navegar a un formulario
    // Por ejemplo: this.router.navigate(['/crear-actividad', this.idEvento]);
  }

  editarActividad(actividad: Actividad): void {
    if (!this.esAdminOOrganizador()) {
      console.log('No tienes permisos para editar actividades');
      return;
    }
    console.log('Editar actividad:', actividad);
    // Aquí puedes añadir la lógica para editar la actividad
    // Por ejemplo: this.router.navigate(['/editar-actividad', actividad.idEventoActividad]);
  }

  public esAdminOOrganizador(): boolean {
    return this.role === 'ADMINISTRADOR' || this.role === 'ORGANIZADOR';
  }

}