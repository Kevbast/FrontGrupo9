import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActividadesService } from '../../services/service.actividad';
import { ServiceTorneo } from '../../services/service.torneo';
import { Actividad } from '../../../models/Actividad';
import { Inscripcion } from '../../../models/Inscripcion';

@Component({
  selector: 'app-activities',
  standalone: false,
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css',
})
export class ActivitiesComponent implements OnInit {
  public actividades: Actividad[] = [];
  public deportes: Actividad[] = [];
  public videojuegos: Actividad[] = [];
  public inscripciones: Inscripcion[] = [];
  public inscripcionesPorActividad: { [key: number]: Inscripcion[] } = {};
  public role: string | null = null;

  private listaVideojuegos = ['FIFA', 'LOL', 'VALORANT', 'CSGO', 'LEAGUE OF LEGENDS', 'POKEMON', 'POKEMON GO', 'VIDEOJUEGO', 'GAMING', 'GAME', 'PLAY STATION', 'XBOX', 'PC GAMING'];

  constructor(
    private actividadesService: ActividadesService,
    private torneoService: ServiceTorneo
  ) {}

  ngOnInit(): void {
    this.role = this.torneoService.getRole();
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Cargar todas las inscripciones
    this.actividadesService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.agruparInscripcionesPorActividad();
        
        console.log('Inscripciones cargadas:', this.inscripciones);
        console.log('Inscripciones por actividad:', this.inscripcionesPorActividad);
      },
      error: (err) => console.error('Error cargando inscripciones:', err)
    });

    // Cargar actividades de la API
    this.actividadesService.getActividades().subscribe({
      next: (data) => {
        console.log('Actividades cargadas de API:', data);
        this.procesarActividades(data);
      },
      error: (err) => console.error('Error cargando actividades:', err)
    });
  }

  procesarActividades(data: any[]): void {
    // Convertir los datos de la API al modelo Actividad
    this.actividades = data.map(act => {
      // Buscar el ID correcto: si hay idEventoActividad usarlo, si no usar idActividad
      const idEventoActividad = act.idEventoActividad || act.idActividad;
      
      return new Actividad(
        idEventoActividad,
        act.nombre,
        act.descripcion || 'Descripción',
        act.max || 50,
        act.materiales || 5,
        act.actual || 0,
        act.inscripciones || []
      );
    });

    this.separarActividadesYVideojuegos();
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

  separarActividadesYVideojuegos(): void {
    this.deportes = this.actividades.filter(act => 
      !this.listaVideojuegos.some(v => act.nombre.toUpperCase().includes(v))
    );
    
    this.videojuegos = this.actividades.filter(act => 
      this.listaVideojuegos.some(v => act.nombre.toUpperCase().includes(v))
    );
  }

  getInscripciones(idEventoActividad: number): Inscripcion[] {
    return this.inscripcionesPorActividad[idEventoActividad] || [];
  }

  getNumeroParticipantes(idEventoActividad: number): number {
    return this.getInscripciones(idEventoActividad).length;
  }

  crearActividad(): void {
    if (!this.esAdminOOrganizador()) {
      return;
    }
    console.log('Crear actividad');
    // TODO: Añadir navegación o diálogo de creación cuando esté disponible.
  }

  editarActividad(act: Actividad): void {
    if (!this.esAdminOOrganizador()) {
      return;
    }
    console.log('Editar actividad', act);
    // TODO: Añadir navegación o diálogo de edición cuando esté disponible.
  }

  editarJuego(game: Actividad): void {
    if (!this.esAdminOOrganizador()) {
      return;
    }
    console.log('Editar juego', game);
    // TODO: Añadir navegación o diálogo de edición cuando esté disponible.
  }

  private esAdminOOrganizador(): boolean {
    return this.role === 'ADMINISTRADOR' || this.role === 'ORGANIZADOR';
  }
}