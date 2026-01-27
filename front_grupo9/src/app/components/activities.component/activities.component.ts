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
import { Pagos } from '../../models/Pagos';
import { Evento } from '../../models/Evento';
import { EventosService } from '../../services/eventosService';

@Component({
  selector: 'app-activities',
  standalone: false,
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css'],
})
export class ActivitiesComponent implements OnInit {
  
  public actividadesEvento!: Array<Actividad>;
  public actividadesDisponibles: Array<Actividad> = [];
  public idActividadSeleccionada: number = 0;
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
  public eventoActual!: Evento;
  
  public rolUsuario: string = ''; 
  public idUsuarioActual: number = 0;
  public idEventoActividadSeleccionada: number = 0;

  // Cache y Control de Desplegable
  public participantesCache: { [idActividad: number]: Usuario[] } = {};
  public actividadAbierta: number | null = null;
  public loadingLista: boolean = false;
  // Diccionario para guardar el número de inscritos por actividad
  public contadoresParticipantes: { [idActividad: number]: number } = {};

  public inscripcion: Inscripcion;
  public actividadNueva: Actividad;
  public actividadEditar: Actividad;
  
  // Perfil
  public usuarioPerfil: Usuario | null = null;
  
  // Diccionario para guardar precios
  public preciosCache: { [key: number]: { idPrecio: number, precio: number } } = {};

  // Variables para Materiales
  public idEventoActividadMateriales: number = 0; 
  public nuevoMaterialNombre: string = ''; 
  // Mapa para almacenar el ID de actividad actual para materiales y verificar participantes
  public idActividadParaMateriales: number = 0;

  constructor(
    private actividadesService: ActividadesService, 
    private materialesService: MaterialesService,
    private inscripcionesService: InscripcionesService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private serviceTorneo: ServiceTorneo,
    private router: Router,
    private eventosService: EventosService
  ) {
    this.inscripcion = new Inscripcion(0, 0, 0, false, new Date().toISOString());
    this.actividadNueva = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
    this.actividadEditar = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
  }

  // Inicializa el componente y carga los datos del evento
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idEvento = +params['idEvento'];
      
      this.cargarDatos();       
      this.cargarPerfil();      
      this.cargarPrecios();     
    });
  }

  // Carga las inscripciones y actividades del evento desde la API
  cargarDatos(): void {
    this.inscripcionesService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.agruparInscripcionesPorActividad();
      },
      error: (err) => {}
    });

    this.actividadesService.getActividadesEvento(this.idEvento).subscribe({
      next: (data) => {
        this.actividadesEvento = data.map(act => new Actividad(
            act.posicion || 0, act.idEvento || 0, act.fechaEvento || '',
            act.idProfesor || 0, act.idActividad || 0, act.nombreActividad || '',
            act.minimoJugadores || 0, act.idEventoActividad || 0
        ));
       // AÑADE ESTO AQUÍ: Cargar contadores para cada actividad---------(nuevo cambio implementado para getNumParticipantes-Kevin)
      this.actividadesEvento.forEach(act => {
        this.actividadesService.findUsuariosInscritosPorActividadEvento(this.idEvento, act.idActividad)
          .subscribe(users => {
            // Guardamos el número en el diccionario
            this.contadoresParticipantes[act.idEventoActividad] = users.length;
          });
      });
    },
      error: (err) => {}
    });
  }

  // Obtiene el perfil del usuario autenticado
  cargarPerfil(): void {
    this.serviceTorneo.getPerfil().subscribe({
      next: (usuario) => {
        this.usuarioPerfil = usuario;
        this.rolUsuario = usuario.role; 
        this.idUsuarioActual = usuario.idUsuario;
      }
    });

    this.eventosService.getEventoById(this.idEvento).subscribe(result => {
      this.eventoActual = result;
    })
  }

  // --- LÓGICA DE PRECIOS ---

  // Carga todos los precios de las actividades y los almacena en caché
  cargarPrecios(): void {
    this.actividadesService.getPrecios().subscribe({
      next: (data) => {
        if(data){
            this.preciosCache = {}; 
            data.forEach((item: any) => {
                this.preciosCache[item.idEventoActividad] = {
                  idPrecio: item.idPrecioActividad,
                  precio: item.precioTotal
                };
            });
        }
      },
      error: (err) => {}
    });
  }

  // Abre el diálogo para crear, editar o eliminar el precio de una actividad
  gestionarPrecio(act: Actividad): void {
    const infoPrecio = this.preciosCache[act.idEventoActividad];
    const precioActual = infoPrecio ? infoPrecio.precio : null;

    const dialogRef = this.dialog.open(PrecioDialogComponent, {
      width: '500px', 
      maxWidth: '95vw',
      data: { 
        nombreActividad: act.nombreActividad,
        precioActual: precioActual 
      }
    });

    dialogRef.afterClosed().subscribe(resultado => {
      if (resultado === 'borrar') {
        if (infoPrecio && infoPrecio.idPrecio) {
          this.borrarPrecioApi(infoPrecio.idPrecio, act.idEventoActividad);
        }
      }
      else if (resultado !== undefined && resultado !== null && typeof resultado === 'number') {
        this.guardarPrecioEnApi(act.idEventoActividad, act.idActividad, resultado); 
      }
    });
  }

  // Elimina el precio de una actividad en la API
  borrarPrecioApi(idPrecio: number, idEventoActividad: number) {
    this.actividadesService.eliminarPrecioActividad(idPrecio).subscribe({
      next: () => {
        delete this.preciosCache[idEventoActividad];
        alert('🗑️ Precio eliminado. La actividad vuelve a ser gratis.');
      },
      error: (err) => {
        alert('❌ Error al eliminar el precio.');
      }
    });
  }

  // Crea o actualiza el precio de una actividad en la API
  guardarPrecioEnApi(idEventoActividad: number, idActividad: number, precio: number) {
    const registroExistente = this.preciosCache[idEventoActividad];

    if (registroExistente) {
      this.actividadesService.actualizarPrecioActividad(registroExistente.idPrecio, idEventoActividad, precio)
        .subscribe({
          next: (res) => {
            this.preciosCache[idEventoActividad].precio = precio;
            alert(`✅ Precio actualizado a ${precio}€.`);
          },
          error: (err) => {
            alert('❌ Error al actualizar el precio.');
          }
        });
    } else {
      this.actividadesService.crearPrecioActividad(idEventoActividad, precio)
        .subscribe({
          next: (res: any) => {
            const nuevoIdPrecio = res.idPrecioActividad || 0; 
            
            this.preciosCache[idEventoActividad] = {
              idPrecio: nuevoIdPrecio,
              precio: precio
            };
            
            alert(`✅ Precio asignado correctamente.`);

            if (nuevoIdPrecio > 0) {
              this.generarRecibosPendientes(this.idEvento, idActividad, nuevoIdPrecio);
            }

            if(!nuevoIdPrecio) this.cargarPrecios(); 
          },
          error: (err) => {
            alert('❌ Error al crear el precio.');
          }
        });
    }
  }

  // Genera recibos de pago automáticamente para los cursos inscritos que no tienen recibo
  generarRecibosPendientes(idEvento: number, idActividad: number, idPrecioActividad: number) {
    this.actividadesService.findUsuariosInscritosPorActividadEvento(idEvento, idActividad).subscribe({
      next: (usuarios) => {
        const cursosInscritos = new Set<number>();
        usuarios.forEach((u: any) => {
          if (u.idCurso && u.idCurso > 0) cursosInscritos.add(u.idCurso);
        });

        if (cursosInscritos.size === 0) return;

        this.actividadesService.getPagosEvento(idEvento).subscribe({
          next: (pagosExistentes) => {
            let cursosAgenerar: number[] = [];

            cursosInscritos.forEach(idCurso => {
              const yaTienePago = pagosExistentes.find((p: any) => 
                p.idCurso === idCurso && p.idActividad === idActividad
              );

              if (!yaTienePago) {
                cursosAgenerar.push(idCurso);
              }
            });

            if (cursosAgenerar.length === 0) {
              return;
            }

            if (confirm(`Se han detectado ${cursosAgenerar.length} cursos nuevos sin recibo. ¿Generar recibos ahora?`)) {
              cursosAgenerar.forEach(idCurso => {
                const nuevoPago = new Pagos(0, idCurso, idPrecioActividad, 0, "Sin pagar");
                this.actividadesService.crearPago(nuevoPago).subscribe({
                  next: () => {},
                  error: (e) => {}
                });
              });
            }
          },
          error: (err) => {}
        });
      }
    });
  }

  // --- NAVEGACIÓN A PAGOS ---
  // Navega a la vista general de pagos del evento
  irAPagosGenerales(): void {
    this.router.navigate(['/pagos', this.idEvento]);
  }

  // Navega a la vista de pagos filtrando por una actividad específica
  irAPagos(act: Actividad): void {
    this.router.navigate(['/pagos', this.idEvento], { 
      queryParams: { actividad: act.nombreActividad } 
    });
  }

  // --- LÓGICA EXISTENTE ---
  // Agrupa las inscripciones por ID de evento-actividad
  agruparInscripcionesPorActividad(): void {
    this.inscripcionesPorActividad = {};
    this.inscripciones.forEach(inscripcion => {
      if (!this.inscripcionesPorActividad[inscripcion.idEventoActividad]) {
        this.inscripcionesPorActividad[inscripcion.idEventoActividad] = [];
      }
      this.inscripcionesPorActividad[inscripcion.idEventoActividad].push(inscripcion);
    });
  }

  // Obtiene las inscripciones de una actividad específica
  getInscripciones(idEventoActividad: number): Inscripcion[] {
    return this.inscripcionesPorActividad[idEventoActividad] || [];
  }

  // Obtiene el número de participantes inscritos en una actividad
  getNumeroParticipantes(idEventoActividad: number): number {
  // Devuelve el valor guardado o 0 si aún no se ha cargado
  return this.contadoresParticipantes[idEventoActividad] || 0;
}

  // Abre o cierra la lista desplegable de participantes de una actividad
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
          this.loadingLista = false;
        }
      });
    }
  }

  // --- MATERIALES (MODIFICADO) ---

  // Abre el modal de materiales y carga la lista de materiales de la actividad
  getMaterialesEventoActividad(idEventoActividad: number, nombreActividad: string): void {
    this.actividadSeleccionada = nombreActividad;
    this.idEventoActividadMateriales = idEventoActividad; 
    
    // Necesitamos el idActividad para buscar participantes. 
    // Lo buscamos en el array de actividades
    const actividad = this.actividadesEvento.find(a => a.idEventoActividad === idEventoActividad);
    if(actividad) {
        this.idActividadParaMateriales = actividad.idActividad;
        // Cargamos los participantes si no están en caché para validaciones posteriores
        if(!this.participantesCache[actividad.idActividad]) {
            this.actividadesService.findUsuariosInscritosPorActividadEvento(this.idEvento, actividad.idActividad).subscribe(users => {
                this.participantesCache[actividad.idActividad] = users;
            });
        }
    }

    this.materialesEventoActividad = []; 
    this.materialesService.getMaterialesEvento(idEventoActividad).subscribe(result => {
      this.materialesEventoActividad = result;
      this.mostrarModal = true;
    })
  }

  // Cierra el modal de materiales y limpia los datos
  cerrarModal(): void {
    this.mostrarModal = false;
    this.materialesEventoActividad = [];
    this.nuevoMaterialNombre = ''; 
  }

  // Crea una nueva solicitud de material (solo participantes inscritos u organizadores)
  crearMaterial(): void {
    if (!this.nuevoMaterialNombre.trim()) return;

    // VALIDACIÓN: Usamos el caché de participantes que cargamos al abrir el modal
    const inscritos = this.participantesCache[this.idActividadParaMateriales] || [];
    const estaInscrito = inscritos.some(u => u.idUsuario === this.idUsuarioActual);

    // Permitimos si es Admin/Org O si está inscrito
    if (!this.esAdminOOrganizador() && !estaInscrito) {
      alert("❌ Solo los participantes inscritos pueden solicitar material para esta actividad.");
      return;
    }

    const nuevoMat = new Material(
      0, 
      this.idEventoActividadMateriales, 
      this.idUsuarioActual, // Solicitante (quien crea la petición)
      this.nuevoMaterialNombre, 
      true, 
      new Date().toISOString(), 
      0 
    );

    this.materialesService.crearMaterial(nuevoMat).subscribe({ // Ojo: tu servicio se llama crearPago
      next: (res) => {
        this.nuevoMaterialNombre = ''; 
        this.recargarMateriales();
      },
      error: (err) => alert('Error al crear solicitud de material')
    });
  }

  // Elimina un material de la lista (solo organizador o creador del material)
  borrarMaterial(idMaterial: number): void {
    if(confirm('¿Eliminar este material de la lista?')) {
      this.materialesService.deleteMateriales(idMaterial).subscribe({
        next: () => this.recargarMateriales(),
        error: (err) => alert('Error al eliminar')
      });
    }
  }

  // Registra al usuario como aportador de un material (solo inscritos u organizadores)
  aportarMaterial(material: Material): void {
    // VALIDACIÓN: Usamos el caché de participantes
    const inscritos = this.participantesCache[this.idActividadParaMateriales] || [];
    const estaInscrito = inscritos.some(u => u.idUsuario === this.idUsuarioActual);

    if (!this.esAdminOOrganizador() && !estaInscrito) {
        alert("❌ Solo los participantes inscritos pueden aportar material.");
        return;
    }

    if(confirm(`¿Te comprometes a traer: ${material.nombreMaterial}?`)) {
      this.materialesService.aportarMaterial(material.idMaterial, this.idUsuarioActual).subscribe({
        next: () => {
          alert('¡Gracias! Has sido registrado como aportador.');
          this.recargarMateriales();
        },
        error: (err) => alert('Error al aportar material')
      });
    }
  }

  // Recarga la lista de materiales desde la API
  recargarMateriales() {
    this.materialesService.getMaterialesEvento(this.idEventoActividadMateriales).subscribe(res => {
      this.materialesEventoActividad = res;
    });
  }

  //--------MODAL INSCRIPCIÓN, ETC... (RESTO IGUAL)
  // Abre el modal de inscripción para una actividad
  abrirModalInscripcion(idEventoActividad: number): void {
    this.idEventoActividadSeleccionada = idEventoActividad;
    this.inscripcion.idUsuario = this.idUsuarioActual;
    this.inscripcion.idEventoActividad = idEventoActividad;
    this.mostrarModalInscripcion = true;
  }

  // Cierra el modal de inscripción y limpia los datos
  cerrarModalInscripcion(): void {
    this.mostrarModalInscripcion = false;
    this.inscripcion = new Inscripcion(0, 0, 0, false, new Date().toISOString());
  }

  // Abre el modal para añadir una actividad al evento
  abrirModalCrearActividad(): void {
    this.mostrarModalCrearActividad = true;
  }

  // Cierra el modal de crear actividad y limpia los datos
  cerrarModalCrearActividad(): void {
    this.mostrarModalCrearActividad = false;
    this.idActividadSeleccionada = 0;
    this.actividadesDisponibles = [];
  }

  // Envía la petición para añadir la actividad seleccionada al evento
  crearActividadEnviar(): void {
    if (!this.idActividadSeleccionada) {
      alert('❌ Por favor selecciona una actividad');
      return;
    }

    this.actividadesService.crearEventoActividad(this.idEvento, this.idActividadSeleccionada).subscribe({
      next: (respuesta) => {
        this.cerrarModalCrearActividad();
        alert('✅ Actividad añadida al evento correctamente');
        setTimeout(() => {
          this.cargarDatos();
          this.cargarPrecios();
        }, 500);
      },
      error: (err) => {
        alert('❌ Error al añadir la actividad al evento');
      }
    });
  }

  // Carga todas las actividades disponibles y abre el modal de selección
  crearActividad(): void {
    if (!this.esAdminOOrganizador()) {
      return;
    }
    // Cargar todas las actividades disponibles
    this.actividadesService.getActividades().subscribe({
      next: (actividades: any[]) => {
        // Mapear las actividades para que tengan nombreActividad desde nombre
        this.actividadesDisponibles = actividades.map(act => ({
          idActividad: act.idActividad,
          nombre: act.nombre,
          nombreActividad: act.nombre,
          minimoJugadores: act.minimoJugadores,
          posicion: 0,
          idEvento: 0,
          fechaEvento: '',
          idProfesor: 0,
          idEventoActividad: 0
        }));
        this.idActividadSeleccionada = 0;
        this.mostrarModalCrearActividad = true;
      },
      error: (err) => {
        alert('❌ Error al cargar las actividades disponibles');
      }
    });
  }

  // Abre el modal de edición con los datos de la actividad seleccionada
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

  // Cierra el modal de editar actividad y limpia los datos
  cerrarModalEditarActividad(): void {
    this.mostrarModalEditarActividad = false;
    this.actividadEditar = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
  }

  // Guarda los cambios realizados en una actividad
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

  // Verifica si el usuario actual es organizador
  public esAdminOOrganizador(): boolean {
    return this.usuarioPerfil?.idRole === 4;
  }

  // Elimina una actividad del evento (solo organizadores)
  eliminarEventoActividad(idEventoActividad: number, nombreActividad: string): void {
    const esOrganizador = this.usuarioPerfil?.idRole === 4;
    
    if (!esOrganizador) {
      return;
    }

    this.actividadesService.eliminarEventoActividad(idEventoActividad).subscribe({
      next: () => {
        alert('✅ Actividad eliminada del evento correctamente.');
        // Limpiar cachés relacionados
        delete this.preciosCache[idEventoActividad];
        if (this.participantesCache[idEventoActividad]) {
          delete this.participantesCache[idEventoActividad];
        }
        // Recargar datos
        this.cargarDatos();
        this.cargarPrecios();
      },
      error: (err) => {}
    });
  }

  // Cierra el modal de error
  public cerrarModalError(): void {
    this.mostrarModalError = false;
    this.mensajeError = '';
  }

  // Envía la inscripción del usuario a una actividad (validando que no esté ya inscrito en otra)
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
        this.cerrarModalInscripcion();
      }
    });
  }

  isFechaSemanaAntes(): boolean {
    let fechaEvento = new Date(this.eventoActual.fechaEvento);
    let semanaAntes = new Date(fechaEvento);
    semanaAntes.setDate(fechaEvento.getDate() - 7);
    let fechaActual = new Date();

    semanaAntes.setHours(0, 0, 0, 0);
    fechaActual.setHours(0, 0, 0, 0);

    if (fechaActual.getTime() === semanaAntes.getTime()) {
      return true;
    }
    return false;
  }
}