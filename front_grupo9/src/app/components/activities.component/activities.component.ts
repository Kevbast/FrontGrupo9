import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActividadesService } from '../../services/service.actividad';
import { InscripcionesService } from '../../services/service.inscripciones';
import { MaterialesService } from '../../services/materialesService';
import { ServiceTorneo } from '../../services/service.torneo';
// Importaciones para el Modal
import { MatDialog } from '@angular/material/dialog';
import { PrecioDialogComponent } from '../precio-dialog/precio-dialog';
import Swal from 'sweetalert2';

// Modelos
import { Actividad } from '../../models/Actividad';
import { Inscripcion } from '../../models/Inscripcion';
import { Material } from '../../models/Material';
import { Usuario } from '../../models/Usuario';
import { Pagos } from '../../models/Pagos';
import { Evento } from '../../models/Evento';
import { EventosService } from '../../services/eventosService';
import { UsuariosCurso } from '../../models/UsuariosCurso';

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
  public idCursoActual: number = 0;
  public idEventoActividadSeleccionada: number = 0;

  // Cache y Control de Desplegable
  public participantesCache: { [idActividad: number]: UsuariosCurso[] } = {};
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
  public preciosCache: { [key: number]: { idPrecio: number; precio: number } } = {};

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
    private eventosService: EventosService,
  ) {
    this.inscripcion = new Inscripcion(0, 0, 0, false, new Date().toISOString());
    this.actividadNueva = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
    this.actividadEditar = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
  }

  // Inicializa el componente y carga los datos del evento
  ngOnInit(): void {
    this.route.params.subscribe((params) => {
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
      error: (err) => {
        console.error('Error al cargar inscripciones:', err);
      },
    });

    this.actividadesService.getActividadesEvento(this.idEvento).subscribe({
      next: (data) => {
        this.actividadesEvento = data.map(
          (act) =>
            new Actividad(
              act.posicion || 0,
              act.idEvento || 0,
              act.fechaEvento || '',
              act.idProfesor || 0,
              act.idActividad || 0,
              act.nombreActividad || '',
              act.minimoJugadores || 0,
              act.idEventoActividad || 0,
            ),
        );
        // AÑADE ESTO AQUÍ: Cargar contadores para cada actividad---------(nuevo cambio implementado para getNumParticipantes-Kevin)
        this.actividadesEvento.forEach((act) => {
          this.actividadesService
            .findUsuariosInscritosPorActividadEvento(this.idEvento, act.idActividad)
            .subscribe((users: UsuariosCurso[]) => {
              // Guardamos el número en el diccionario
              this.contadoresParticipantes[act.idEventoActividad] = users.length;
            });
        });
      },
      error: (err) => console.error('Error actividades:', err),
    });
  }

  // Obtiene el perfil del usuario autenticado
  cargarPerfil(): void {
    this.serviceTorneo.getPerfil().subscribe({
      next: (usuario) => {
        this.usuarioPerfil = usuario;
        this.rolUsuario = usuario.role;
        this.idUsuarioActual = usuario.idUsuario;
        this.idCursoActual = usuario.idCurso;
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
      }
    });

    this.eventosService.getEventoById(this.idEvento).subscribe({
      next: (result) => {
        this.eventoActual = result;
      },
      error: (err) => {
        console.error('Error al cargar evento:', err);
      }
    });
  }

  // --- LÓGICA DE PRECIOS ---

  // Carga todos los precios de las actividades y los almacena en caché
  cargarPrecios(): void {
    this.actividadesService.getPrecios().subscribe({
      next: (data) => {
        if (data) {
          this.preciosCache = {};
          data.forEach((item: any) => {
            this.preciosCache[item.idEventoActividad] = {
              idPrecio: item.idPrecioActividad,
              precio: item.precioTotal,
            };
          });
          
        }
      },
      error: (err) => console.error('Error al cargar precios:', err),
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
        precioActual: precioActual,
      },
    });

    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado === 'borrar') {
        if (infoPrecio && infoPrecio.idPrecio) {
          this.borrarPrecioApi(infoPrecio.idPrecio, act.idEventoActividad);
        }
      } else if (resultado !== undefined && resultado !== null && typeof resultado === 'number') {
        this.guardarPrecioEnApi(act.idEventoActividad, act.idActividad, resultado);
      }
    });
  }

  // Elimina el precio de una actividad en la API
  borrarPrecioApi(idPrecio: number, idEventoActividad: number) {
    this.actividadesService.eliminarPrecioActividad(idPrecio).subscribe({
      next: () => {
        delete this.preciosCache[idEventoActividad];
        Swal.fire({
          icon: 'success',
          title: 'Precio eliminado',
          text: 'La actividad vuelve a ser gratis.',
          timer: 2500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el precio. Inténtalo de nuevo.',
          confirmButtonColor: '#d33'
        });
      },
    });
  }

  // Crea o actualiza el precio de una actividad en la API
  guardarPrecioEnApi(idEventoActividad: number, idActividad: number, precio: number) {
    const registroExistente = this.preciosCache[idEventoActividad];

    // CASO 1: ACTUALIZAR PRECIO EXISTENTE
    if (registroExistente) {
      console.log('📝 Actualizando precio existente:', {
        idPrecio: registroExistente.idPrecio,
        idEventoActividad,
        precio
      });

      this.actividadesService
        .actualizarPrecioActividad(registroExistente.idPrecio, idEventoActividad, precio)
        .subscribe({
          next: (res) => {
            this.preciosCache[idEventoActividad].precio = precio;
            console.log('✅ Precio actualizado correctamente');
            
            // Si el precio es mayor a 0, generamos recibos automáticamente
            if (precio > 0) {
              console.log('💰 Iniciando generación de recibos pendientes...');
              this.generarRecibosPendientes(this.idEvento, idActividad, registroExistente.idPrecio);
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Precio actualizado',
                text: `El precio se actualizó a ${precio}€`,
                timer: 2000,
                showConfirmButton: false
              });
            }
          },
          error: (err) => {
            console.error('❌ Error al actualizar precio:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar el precio.',
              confirmButtonColor: '#d33'
            });
          },
        });
    } 
    // CASO 2: CREAR NUEVO PRECIO
    else {
      console.log('🆕 Creando nuevo precio:', { idEventoActividad, precio });

      this.actividadesService.crearPrecioActividad(idEventoActividad, precio).subscribe({
        next: (res: any) => {
          console.log('📦 Respuesta de crear precio:', res);
          
          // Intentar obtener el ID del precio de múltiples formas
          const nuevoIdPrecio = res.idPrecioActividad || res.IdPrecioActividad || res.id || res.Id || 0;
          
          console.log('🔑 ID precio obtenido:', nuevoIdPrecio);

          if (nuevoIdPrecio > 0) {
            this.preciosCache[idEventoActividad] = {
              idPrecio: nuevoIdPrecio,
              precio: precio,
            };

            // Si el precio es > 0, generamos recibos automáticamente SIN timeout
            if (precio > 0) {
              console.log('💰 Iniciando generación de recibos pendientes...');
              this.generarRecibosPendientes(this.idEvento, idActividad, nuevoIdPrecio);
            } else {
              Swal.fire({
                icon: 'success',
                title: 'Precio asignado',
                text: 'El precio se asignó correctamente.',
                timer: 2000,
                showConfirmButton: false
              });
            }
          } else {
            console.warn('⚠️ No se pudo obtener el ID del precio. Recargando lista...');
            Swal.fire({
              icon: 'warning',
              title: 'Precio creado',
              text: 'El precio fue creado pero sin ID. Recarga la página para ver los cambios.',
              confirmButtonColor: '#f39c12'
            });
            this.cargarPrecios();
          }
        },
        error: (err) => {
          console.error('❌ Error al crear precio:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo crear el precio.',
            confirmButtonColor: '#d33'
          });
        },
      });
    }
  }

  // Genera recibos de pago automáticamente
  generarRecibosPendientes(idEvento: number, idActividad: number, idPrecioActividad: number) {
    console.log('🎫 Iniciando generación de pago automático:', {
      idEvento,
      idActividad,
      idPrecioActividad,
      idCursoActual: this.idCursoActual
    });
    
    // Verificar si ya existe un pago para este curso y actividad
    this.actividadesService.getPagosEvento(idEvento).subscribe({
      next: (pagosExistentes) => {
        console.log('💳 Pagos existentes en el evento:', pagosExistentes.length);
        
        // Comprobar si ya existe un pago para el curso actual y esta actividad
        const yaTienePago = pagosExistentes.find(
          (p: any) => p.idCurso === this.idCursoActual && p.idActividad === idActividad
        );

        if (yaTienePago) {
          console.log('⚠️ Ya existe un pago para este curso y actividad.');
          Swal.fire({
            icon: 'info',
            title: 'Precio asignado',
            text: 'Ya existe un recibo de pago para esta actividad.',
            timer: 2500,
            showConfirmButton: false
          });
          return;
        }

        // Crear el pago automáticamente usando el curso del usuario logueado
        const nuevoPago = new Pagos(0, this.idCursoActual, idPrecioActividad, 0, 'SIN PAGAR');
        
        console.log('📄 Creando pago automático:', nuevoPago);
        
        this.actividadesService.crearPago(nuevoPago).subscribe({
          next: () => {
            console.log('✅ Pago generado correctamente');
            Swal.fire({
              icon: 'success',
              title: '¡Precio y recibo creados!',
              text: 'El precio se asignó y se generó el recibo de pago automáticamente.',
              timer: 3000,
              showConfirmButton: false
            });
          },
          error: (e) => {
            console.error('❌ Error generando pago:', e);
            Swal.fire({
              icon: 'warning',
              title: 'Precio asignado',
              text: 'El precio se asignó, pero hubo un error al generar el recibo de pago.',
              confirmButtonColor: '#f39c12'
            });
          },
        });
      },
      error: (err) => {
        console.error('❌ Error comprobando pagos existentes:', err);
        Swal.fire({
          icon: 'warning',
          title: 'Precio asignado',
          text: 'El precio se asignó, pero no se pudo verificar los recibos existentes.',
          confirmButtonColor: '#f39c12'
        });
      },
    });
  }

  // --- NAVEGACIÓN A PAGOS ---
  // Navega a la vista general de pagos del evento
  irAPagosGenerales(): void {
    this.router.navigate(['/pagos', this.idEvento]);
  }



  // --- LÓGICA EXISTENTE ---
  // Agrupa las inscripciones por ID de evento-actividad
  agruparInscripcionesPorActividad(): void {
    this.inscripcionesPorActividad = {};
    this.inscripciones.forEach((inscripcion) => {
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
      this.actividadesService
        .findUsuariosInscritosPorActividadEvento(idEvento, idActividad)
        .subscribe({
          next: (users: UsuariosCurso[]) => {
            this.participantesCache[idActividad] = users;
            this.loadingLista = false;
          },
          error: (err) => {
            console.error(err);
            this.loadingLista = false;
          },
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
    const actividad = this.actividadesEvento.find((a) => a.idEventoActividad === idEventoActividad);
    if (actividad) {
      this.idActividadParaMateriales = actividad.idActividad;
      // Cargamos los participantes si no están en caché para validaciones posteriores
      if (!this.participantesCache[actividad.idActividad]) {
        this.actividadesService
          .findUsuariosInscritosPorActividadEvento(this.idEvento, actividad.idActividad)
          .subscribe((users: UsuariosCurso[]) => {
            this.participantesCache[actividad.idActividad] = users;
          });
      }
    }

    this.materialesEventoActividad = [];
    this.materialesService.getMaterialesEvento(idEventoActividad).subscribe((result) => {
      this.materialesEventoActividad = result;
      this.mostrarModal = true;
    });
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
    const estaInscrito = inscritos.some((u) => u.idUsuario === this.idUsuarioActual);

    // Permitimos si es Admin/Org O si está inscrito
    if (!this.esAdminOOrganizador() && !estaInscrito) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Solo los participantes inscritos pueden solicitar material para esta actividad.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    const nuevoMat = new Material(
      0,
      this.idEventoActividadMateriales,
      this.idUsuarioActual, // Solicitante (quien crea la petición)
      this.nuevoMaterialNombre,
      true,
      new Date().toISOString(),
      0,
    );

    this.materialesService.crearMaterial(nuevoMat).subscribe({
      // Ojo: tu servicio se llama crearPago
      next: (res) => {
        this.nuevoMaterialNombre = '';
        this.recargarMateriales();
        Swal.fire({
          icon: 'success',
          title: 'Material solicitado',
          text: 'La solicitud de material se creó correctamente.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo crear la solicitud de material.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  // Elimina un material de la lista (solo organizador o creador del material)
  borrarMaterial(idMaterial: number): void {
    Swal.fire({
      title: '¿Eliminar material?',
      text: 'Esta solicitud de material se eliminará de la lista',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.materialesService.deleteMateriales(idMaterial).subscribe({
          next: () => {
            this.recargarMateriales();
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'El material se eliminó de la lista.',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el material.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  // Registra al usuario como aportador de un material (solo inscritos u organizadores)
  aportarMaterial(material: Material): void {
    // VALIDACIÓN: Usamos el caché de participantes
    const inscritos = this.participantesCache[this.idActividadParaMateriales] || [];
    const estaInscrito = inscritos.some((u) => u.idUsuario === this.idUsuarioActual);

    if (this.esAdminOOrganizador() && !estaInscrito) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text: 'Solo los participantes inscritos pueden aportar material.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    Swal.fire({
      title: '¿Aportar material?',
      text: `¿Te comprometes a traer: ${material.nombreMaterial}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, lo traeré',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.materialesService.aportarMaterial(material.idMaterial, this.idUsuarioActual).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Gracias!',
              text: 'Has sido registrado como aportador de este material.',
              timer: 2500,
              showConfirmButton: false
            });
            this.recargarMateriales();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo registrar tu aportación.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }

  // Recarga la lista de materiales desde la API
  recargarMateriales() {
    this.materialesService
      .getMaterialesEvento(this.idEventoActividadMateriales)
      .subscribe((res) => {
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
      Swal.fire({
        icon: 'warning',
        title: 'Selección requerida',
        text: 'Por favor selecciona una actividad antes de continuar.',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    // Mostrar loading mientras se añade
    Swal.fire({
      title: 'Añadiendo actividad...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.actividadesService.crearEventoActividad(this.idEvento, this.idActividadSeleccionada).subscribe({
      next: (respuesta) => {
        this.cerrarModalCrearActividad();
        Swal.fire({
          icon: 'success',
          title: '¡Actividad añadida!',
          text: 'La actividad se añadió correctamente al evento.',
          timer: 2500,
          showConfirmButton: false
        });
        setTimeout(() => {
          this.cargarDatos();
          this.cargarPrecios();
        }, 500);
      },
      error: (err) => {
        console.error('Error al añadir actividad:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo añadir la actividad al evento. Intenta nuevamente.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  // Carga todas las actividades disponibles y abre el modal de selección
  crearActividad(): void {
    // Cargar todas las actividades disponibles
    this.actividadesService.getActividades().subscribe({
      next: (actividades: any[]) => {
        // Obtener los IDs de las actividades ya asociadas al evento
        const actividadesYaEnEvento = this.actividadesEvento.map(act => act.idActividad);
        
        // Filtrar las actividades que NO están ya en el evento
        const actividadesFiltradas = actividades.filter(act => 
          !actividadesYaEnEvento.includes(act.idActividad)
        );
        
        // Mapear las actividades filtradas para que tengan nombreActividad desde nombre
        this.actividadesDisponibles = actividadesFiltradas.map(act => ({
          idActividad: act.idActividad,
          nombre: act.nombre,
          nombreActividad: act.nombre,
          minimoJugadores: act.minimoJugadores,
          posicion: 0,
          idEvento: 0,
          fechaEvento: '',
          idProfesor: 0,
          idEventoActividad: 0,
        }));
        
        // Validar si hay actividades disponibles para añadir
        if (this.actividadesDisponibles.length === 0) {
          Swal.fire({
            icon: 'info',
            title: 'No hay actividades disponibles',
            text: 'Todas las actividades ya están añadidas a este evento.',
            confirmButtonColor: '#3085d6'
          });
          return;
        }
        
        this.idActividadSeleccionada = 0;
        this.mostrarModalCrearActividad = true;
      },
      error: (err) => {
        console.error('Error al cargar actividades:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar las actividades disponibles. Intenta nuevamente.',
          confirmButtonColor: '#d33'
        });
      },
    });
  }

  // Abre el modal de edición con los datos de la actividad seleccionada
  editarActividad(actividad: Actividad): void {
    
    this.actividadEditar = new Actividad(
      actividad.posicion,
      actividad.idEvento,
      actividad.fechaEvento,
      actividad.idProfesor,
      actividad.idActividad,
      actividad.nombreActividad,
      actividad.minimoJugadores,
      actividad.idEventoActividad,
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
    // Mostrar loading mientras se actualiza
    Swal.fire({
      title: 'Guardando cambios...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.actividadesService.actualizarActividad(this.actividadEditar).subscribe({
      next: (respuesta) => {
        this.cerrarModalEditarActividad();
        Swal.fire({
          icon: 'success',
          title: '¡Cambios guardados!',
          text: 'La actividad se actualizó correctamente.',
          timer: 2500,
          showConfirmButton: false
        });
        setTimeout(() => {
          this.cargarDatos();
        }, 500);
      },
      error: (err) => {
        console.error('Error al actualizar actividad:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron guardar los cambios. Intenta nuevamente.',
          confirmButtonColor: '#d33'
        });
      },
    });
  }

  // Verifica si el usuario actual es organizador
  public esAdminOOrganizador(): boolean {
    return this.idUsuarioActual === 3||this.idUsuarioActual === 4;
  }

  // Elimina una actividad del evento (solo organizadores)
  eliminarEventoActividad(idEventoActividad: number, nombreActividad: string): void {
    const esOrganizador = this.usuarioPerfil?.idRole === 4 || this.usuarioPerfil?.idRole === 6;

    if (!esOrganizador) {
      return;
    }

    Swal.fire({
      title: '¿Estás seguro?',
      html: `Se eliminará la actividad <strong>${nombreActividad}</strong> del evento.<br><br>
             <span style="color: #d33;">⚠️ Esta acción también eliminará:</span><br>
             • Todas las inscripciones<br>
             • Todos los equipos asociados<br>
             • Todos los materiales solicitados<br>
             • Todos los resultados/partidos<br><br>
             <strong>Esta acción no se puede deshacer.</strong>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading mientras se elimina
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.actividadesService.eliminarEventoActividad(idEventoActividad).subscribe({
          next: () => {
            // Limpiar cachés relacionados
            delete this.preciosCache[idEventoActividad];
            if (this.participantesCache[idEventoActividad]) {
              delete this.participantesCache[idEventoActividad];
            }
            
            // Mostrar mensaje de éxito
            Swal.fire({
              title: '¡Eliminada!',
              text: 'La actividad ha sido eliminada del evento correctamente.',
              icon: 'success',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#3085d6'
            });
            
            // Recargar datos
            this.cargarDatos();
            this.cargarPrecios();
          },
          error: (err) => {
            console.error('Error al eliminar actividad:', err);
            Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la actividad. Intente nuevamente.',
              icon: 'error',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#3085d6'
            });
          }
        });
      }
    });
  }

  // Cierra el modal de error
  public cerrarModalError(): void {
    this.mostrarModalError = false;
    this.mensajeError = '';
  }

  // Envía la inscripción del usuario a una actividad (validando que no esté ya inscrito en otra)
  public enviarInscripcion(): void {
    const actividadesDelEvento = this.actividadesEvento.map((act) => act.idEventoActividad);
    const yaInscrito = this.inscripciones.some(
      (insc) =>
        insc.idUsuario === this.idUsuarioActual &&
        actividadesDelEvento.includes(insc.idEventoActividad),
    );

    if (yaInscrito) {
      this.cerrarModalInscripcion();
      Swal.fire({
        icon: 'warning',
        title: 'Ya estás inscrito',
        text: 'Solo puedes inscribirte en una actividad por evento.',
        confirmButtonColor: '#f39c12'
      });
      return;
    }

    // Mostrar loading mientras se procesa
    Swal.fire({
      title: 'Procesando inscripción...',
      text: 'Por favor espera',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.inscripcionesService.crearInscripcion(this.inscripcion).subscribe({
      next: (respuesta) => {
        this.cerrarModalInscripcion();
        if (this.participantesCache[this.idEventoActividadSeleccionada]) {
          delete this.participantesCache[this.idEventoActividadSeleccionada];
        }
        Swal.fire({
          icon: 'success',
          title: '¡Inscripción exitosa!',
          text: 'Te has inscrito correctamente en la actividad.',
          timer: 3000,
          showConfirmButton: false
        });
        setTimeout(() => {
          this.cargarDatos();
        }, 500);
      },
      error: (err) => {
        console.error('Error en inscripción:', err);
        this.cerrarModalInscripcion();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo completar la inscripción. Intenta nuevamente.',
          confirmButtonColor: '#d33'
        });
      },
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
