import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActividadesService } from '../../services/service.actividad';
import { InscripcionesService } from '../../services/service.inscripciones';
import { MaterialesService } from '../../services/materialesService';
import { ServiceTorneo } from '../../services/service.torneo';
// Importaciones para el Modal
import { MatDialog } from '@angular/material/dialog';
import { PrecioDialogComponent } from '../precio-dialog/precio-dialog';

// Modelos
import { Actividad } from '../../models/Actividad';
import { Inscripcion } from '../../models/Inscripcion';
import { Material } from '../../models/Material';
import { Usuario } from '../../models/Usuario';

@Component({
  selector: 'app-activities',
  standalone: false,
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css'],
})
export class ActivitiesComponent implements OnInit {
  
  public actividadesEvento!: Array<Actividad>;
  public inscripciones: Inscripcion[] = [];
  public inscripcionesPorActividad: { [key: number]: Inscripcion[] } = {};
  public materialesEventoActividad!: Array<Material>;
  public mostrarModal: boolean = false;
  public actividadSeleccionada: string = '';
  public idEvento!: number;

  // Cache y Control de Desplegable
  public participantesCache: { [idActividad: number]: Usuario[] } = {};
  public actividadAbierta: number | null = null;
  public loadingLista: boolean = false;

  // Perfil
  public usuarioPerfil: Usuario | null = null;
  public rolUsuario: string = '';

  // Diccionario para guardar precios: Clave=idEventoActividad, Valor=Precio
  public preciosCache: { [key: number]: number } = {};

  constructor(
    private actividadesService: ActividadesService, 
    private materialesService: MaterialesService,
    private inscripcionesService: InscripcionesService,
    private serviceTorneo: ServiceTorneo,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idEvento = +params['idEvento'];
      
      this.cargarDatos();       // Carga inscripciones y actividades
      this.cargarPerfil();      // Carga rol del usuario
      this.cargarPrecios();     // <--- CARGAMOS LOS PRECIOS AL INICIO
    });
  }

  cargarDatos(): void {
    // 1. Inscripciones
    this.inscripcionesService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.agruparInscripcionesPorActividad();
      },
      error: (err) => console.error('Error cargando inscripciones:', err)
    });

    // 2. Actividades
    this.actividadesService.getActividadesEvento(this.idEvento).subscribe({
      next: (data) => {
        this.actividadesEvento = data.map(act => new Actividad(
            act.posicion || 0, act.idEvento || 0, act.fechaEvento || '',
            act.idProfesor || 0, act.idActividad || 0, act.nombreActividad || '',
            act.minimoJugadores || 0, act.idEventoActividad || 0
        ));
      },
      error: (err) => console.error('Error actividades:', err)
    });
  }

  cargarPerfil(): void {
    this.serviceTorneo.getPerfil().subscribe({
      next: (usuario) => {
        this.usuarioPerfil = usuario;
        this.rolUsuario = usuario.role;
      }
    });
  }

  // --- LÓGICA DE PRECIOS (IMPLEMENTADA) ---

  // 1. Obtener todos los precios y mapearlos
  cargarPrecios(): void {
    // Asegúrate de tener getPrecios() en tu servicio. Si no, añádelo.
    this.actividadesService.getPrecios().subscribe({
      next: (data) => {
        // La API devuelve un array, lo convertimos a diccionario para acceso rápido
        if(data){
            data.forEach((precioItem: any) => {
                // precioItem tiene { idEventoActividad, precioTotal, ... }
                this.preciosCache[precioItem.idEventoActividad] = precioItem.precioTotal;
            });
            console.log("💰 Precios cargados en caché:", this.preciosCache);
        }
      },
      error: (err) => console.error("Error al cargar precios:", err)
    });
  }

  // 2. Abrir Modal
  gestionarPrecio(act: Actividad): void {
    const dialogRef = this.dialog.open(PrecioDialogComponent, {
      width: '350px',
      data: { nombreActividad: act.nombreActividad }
    });

    dialogRef.afterClosed().subscribe(precio => {
      if (precio !== undefined && precio !== null) {
        this.guardarPrecioEnApi(act.idEventoActividad, precio);
      }
    });
  }

  // 3. Guardar en API y Actualizar Vista
  guardarPrecioEnApi(idEventoActividad: number, precio: number) {
    this.actividadesService.crearPrecioActividad(idEventoActividad, precio).subscribe({
      next: (res) => {
        // ÉXITO: Actualizamos la caché local inmediatamente
        this.preciosCache[idEventoActividad] = precio; 
        alert(`✅ Precio de ${precio}€ asignado correctamente.`);
      },
      error: (err) => {
        console.error("Error guardando precio:", err);
        
        // Manejo específico del error 405 (Method Not Allowed)
        if (err.status === 405) {
          alert("⚠️ Error 405: Ya existe un precio para esta actividad. (La API pide usar PUT en vez de POST).");
          // Si tu API lo requiere, aquí podrías intentar llamar a un método 'actualizarPrecio' (PUT)
        } else {
          alert('❌ Error al guardar el precio. Revisa la consola.');
        }
      }
    });
  }

  // --- NAVEGACIÓN A PAGOS ---
  
  // Para el botón general del panel de control
  irAPagosGenerales(): void {
    this.router.navigate(['/pagos', this.idEvento]);
  }

  // Para navegar filtrando por actividad (opcional)
  irAPagos(act: Actividad): void {
    this.router.navigate(['/pagos', this.idEvento], { 
      queryParams: { actividad: act.nombreActividad } 
    });
  }

  // --- LÓGICA EXISTENTE ---
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
      this.actividadesService.findUsuariosInscritosPorActividadEvento(idEvento, idActividad).subscribe({
        next: (users) => {
          this.participantesCache[idActividad] = users;
          this.loadingLista = false;
        },
        error: (err) => {
          console.error(err);
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
}