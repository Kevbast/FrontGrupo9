import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActividadesService } from '../../services/service.actividad';
import { InscripcionesService } from '../../services/service.inscripciones';
import { MaterialesService } from '../../services/materialesService';
import { MatDialog } from '@angular/material/dialog';
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
  public mostrarModalInscripcion: boolean = false;
  public mostrarModalCrearActividad: boolean = false;
  public mostrarModalEditarActividad: boolean = false;
  public idEvento!: number;
  public role: string | null = null;
  public idUsuarioActual: number = 0;
  public idEventoActividadSeleccionada: number = 0;

  // --- NUEVAS VARIABLES PARA EL DESPLEGABLE ---
  // Cache para guardar participantes por ID de Actividad para no repetir llamadas
  public participantesCache: { [idActividad: number]: Usuario[] } = {};

  // Controla qué tarjeta está abierta (null = ninguna)
  public actividadAbierta: number | null = null;
  
  // Spinner de carga local
  public loadingLista: boolean = false;

  // Función para enviar inscripción
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
    // Obtener el rol del usuario
    this.torneoService.getPerfil().subscribe({
      next: (usuario) => {
        this.role = usuario.role;
        this.idUsuarioActual = usuario.idUsuario;
        console.log('Perfil cargado - ID Usuario:', usuario.idUsuario, 'Usuario completo:', usuario);
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
      }
    });
    
    // Obtener el idEvento de los parámetros de la ruta
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
    // Limpiar el array primero para forzar la actualización en Angular
    this.actividadesEvento = [];
    
    this.actividadesService.getActividadesEvento(this.idEvento).subscribe({
      next: (data) => {
        console.log('📥 Actividades recibidas desde API (RAW):', JSON.stringify(data, null, 2));
        
        // Crear un nuevo array para forzar detección de cambios
        const actividadesActualizadas = data.map((act: any) => {
          console.log(`Mapeando actividad ID ${act.idActividad}:`, {
            nombreActividad: act.nombreActividad,
            nombre: act.nombre,
            nombreFinal: act.nombreActividad || act.nombre || ''
          });
          
          return new Actividad(
            act.posicion || 0,
            act.idEvento || 0,
            act.fechaEvento || '',
            act.idProfesor || 0,
            act.idActividad || 0,
            act.nombreActividad || act.nombre || '',  // Mapear tanto nombreActividad como nombre
            act.minimoJugadores || 0,
            act.idEventoActividad || 0
          );
        });
        
        // Asignar el nuevo array
        this.actividadesEvento = actividadesActualizadas;
        console.log('✅ Actividades mapeadas y asignadas al componente:', this.actividadesEvento.map(a => ({
          id: a.idActividad,
          nombre: a.nombreActividad
        })));
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
      
      // Get inscriptions for this activity and map to users
      const inscripcionesActividad = this.getInscripciones(idActividad);
      const usuariosIds = inscripcionesActividad.map(insc => insc.idUsuario);
      
      // Fetch user details for the inscribed users
      this.inscripcionesService.getUsuariosPorInscripcion(usuariosIds).subscribe({
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

  abrirModalInscripcion(idEventoActividad: number): void {
    this.idEventoActividadSeleccionada = idEventoActividad;
    this.inscripcion.idUsuario = this.idUsuarioActual;
    this.inscripcion.idEventoActividad = idEventoActividad;
    console.log('Modal abierto - ID Usuario:', this.idUsuarioActual, 'ID Actividad:', idEventoActividad);
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
    console.log('Actividad a crear:', this.actividadNueva);
    console.log('idEvento actual:', this.idEvento);
    
    // Crear instancia de Actividad con los datos del formulario
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
    
    console.log('Datos enviando:', actividadEnvio);
    console.log('JSON enviado:', JSON.stringify(actividadEnvio));
    this.actividadesService.crearActividad(actividadEnvio).subscribe({
      next: (respuesta) => {
        console.log('Actividad creada exitosamente:', respuesta);
        
        // Intentar crear la relación EventoActividad (endpoint con problemas en backend)
        this.actividadesService.crearEventoActividad(this.idEvento, respuesta.idActividad).subscribe({
          next: (eventoActividadRespuesta) => {
            console.log('✅ EventoActividad creado exitosamente:', eventoActividadRespuesta);
            alert('✅ Actividad creada y asociada al evento exitosamente');
            this.cerrarModalCrearActividad();
            setTimeout(() => {
              this.cargarDatos();
            }, 500);
          },
          error: (err) => {
            console.error('❌ Error del backend en EventoActividad:', err);
            console.error('Detalles:', err.error);
            console.error('Status:', err.status);
            
            // La actividad SE CREÓ correctamente, pero el backend no puede asociarla al evento
            // Esto es un problema del backend (error 500 sin detalles)
            alert(`⚠️ ACTIVIDAD CREADA (ID: ${respuesta.idActividad})\n\n` +
                  `Sin embargo, el backend tiene un error 500 al asociarla al evento.\n` +
                  `Contacta al equipo de backend para revisar el endpoint:\n` +
                  `POST /api/ActividadesEvento/create\n\n` +
                  `La actividad existe en la BD pero no aparecerá en este evento hasta que se corrija el backend.`);
            
            this.cerrarModalCrearActividad();
            // Recargar de todas formas por si acaso
            setTimeout(() => {
              this.cargarDatos();
            }, 500);
          }
        });
      },
      error: (err) => {
        console.error('Error al crear actividad:', err);
        console.error('Detalles del error:', err.error);
        console.error('Status:', err.status);
        console.error('Mensaje:', err.message);
        console.error('Errores de validación:', err.error?.errors);
        const erroresValidacion = Object.entries(err.error?.errors || {})
          .map(([key, value]: any) => `${key}: ${value.join(', ')}`)
          .join(' | ');
        alert('Error de validación: ' + (erroresValidacion || err.statusText));
      }
    });
  }

  crearActividad(): void {
    if (!this.esAdminOOrganizador()) {
      console.log('No tienes permisos para crear actividades');
      return;
    }
    this.actividadNueva = new Actividad(0, this.idEvento, new Date().toISOString(), 0, 0, '', 0, 0);
    this.mostrarModalCrearActividad = true;
  }

  editarActividad(actividad: Actividad): void {
    if (!this.esAdminOOrganizador()) {
      console.log('No tienes permisos para editar actividades');
      return;
    }
    console.log('Editar actividad:', actividad);
    // Copiar los valores de la actividad seleccionada
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
    console.log('💾 Guardar cambios de actividad:', this.actividadEditar);
    
    this.actividadesService.actualizarActividad(this.actividadEditar).subscribe({
      next: (respuesta) => {
        console.log('✅ Backend respondió:', respuesta);
        
        // Cerrar modal
        this.cerrarModalEditarActividad();
        
        // Recargar datos desde el backend
        setTimeout(() => {
          this.cargarDatos();
        }, 500);
        
        alert('✅ Actividad actualizada exitosamente');
      },
      error: (err) => {
        console.error('Error al actualizar actividad:', err);
        alert('❌ Error al actualizar la actividad: ' + (err.error?.message || err.statusText));
      }
    });
  }

  public esAdminOOrganizador(): boolean {
    return this.role === 'ADMINISTRADOR' || this.role === 'ORGANIZADOR';
  }

  // Función para el botón del formulario
  public enviarInscripcion(): void {
    console.log('Datos capturados en el formulario:', this.inscripcion);
    // Aquí se llamará a crearInscripcion del servicio más adelante
    this.cerrarModalInscripcion();
  }


}