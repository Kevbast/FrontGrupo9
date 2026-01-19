import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActividadesService } from '../../services/service.actividad';
import { InscripcionesService } from '../../services/service.inscripciones';
import { MaterialesService } from '../../services/materialesService';
// Modelos
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
  public idEvento!: number;
  public role: string | null = null;

  // --- NUEVAS VARIABLES PARA EL DESPLEGABLE ---
  // Cache para guardar participantes por ID de Actividad para no repetir llamadas
  public participantesCache: { [idActividad: number]: Usuario[] } = {};

  // Controla qué tarjeta está abierta (null = ninguna)
  public actividadAbierta: number | null = null;
  
  // Spinner de carga local
  public loadingLista: boolean = false;

  constructor(
    private actividadesService: ActividadesService, 
    private materialesService: MaterialesService,
    private inscripcionesService: InscripcionesService,
    private route: ActivatedRoute,
    private torneoService: ServiceTorneo
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idEvento = +params['idEvento'];
      console.log('ID Evento recibido:', this.idEvento);
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    // 1. Cargar todas las inscripciones para contar participantes
    this.inscripcionesService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.agruparInscripcionesPorActividad();
      },
      error: (err) => console.error('Error cargando inscripciones:', err)
    });

    // 2. Cargar actividades del evento
    this.actividadesService.getActividadesEvento(this.idEvento).subscribe({
      next: (data) => {
        console.log('Actividades cargadas:', data);
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
      },
      error: (err) => console.error('Error cargando actividades:', err)
    })
  }

  // --- LÓGICA DE CONTEO DE INSCRITOS ---
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

  // --- LÓGICA DE DESPLEGAR PARTICIPANTES (TOGGLE) ---
  toggleParticipantes(idEvento: number, idActividad: number): void {
    console.log("--- CLICK EN TOGGLE ---");
    console.log("Abriendo actividad ID:", idActividad);

    if (this.actividadAbierta === idActividad) {
      this.actividadAbierta = null;
      return;
    }

    this.actividadAbierta = idActividad;

    if (!this.participantesCache[idActividad]) {
      this.loadingLista = true;
      
      this.actividadesService.findUsuariosInscritosPorActividadEvento(idEvento, idActividad).subscribe({
        next: (users) => {
          // --- AQUÍ ESTÁ LA CLAVE ---
          console.log("✅ DATOS RECIBIDOS DE LA API:", users); 
          
          this.participantesCache[idActividad] = users;
          this.loadingLista = false;
          
          if (users.length > 0) {
            console.log("🔍 Ejemplo del primer usuario:", users[0]);
          } else {
            console.warn("⚠️ El array de usuarios está VACÍO");
          }
        },
        error: (err) => {
          console.error("❌ Error cargando participantes", err);
          this.loadingLista = false;
        }
      });
    } else {
      console.log("⚡ Cargando desde caché local:", this.participantesCache[idActividad]);
    }
  }

  // --- MODAL DE MATERIALES ---
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