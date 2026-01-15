import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActividadesService } from '../../services/service.actividad';
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
  public deportes: Actividad[] = [];
  public videojuegos: Actividad[] = [];
  public inscripciones: Inscripcion[] = [];
  public inscripcionesPorActividad: { [key: number]: Inscripcion[] } = {};
  public materialesEventoActividad!: Array<Material>;
  public mostrarModal: boolean = false;
  public actividadSeleccionada: string = '';

  private listaVideojuegos = ['FIFA', 'LOL', 'VALORANT', 'CSGO', 'LEAGUE OF LEGENDS', 'POKEMON', 'POKEMON GO', 'VIDEOJUEGO', 'GAMING', 'GAME', 'PLAY STATION', 'XBOX', 'PC GAMING'];

  constructor(private actividadesService: ActividadesService, private materialesService: MaterialesService) {}

  ngOnInit(): void {
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


}