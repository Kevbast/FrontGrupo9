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
import { Pagos } from '../../models/Pagos'; // Asegúrate de tener importado el modelo Pagos

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
  public mostrarModalInscripcion: boolean = false;
  public mostrarModalCrearActividad: boolean = false;
  public mostrarModalEditarActividad: boolean = false;
  public mostrarModalError: boolean = false;
  public mensajeError: string = '';
  public idEvento!: number;
  public role: string | null = null;
  public idUsuarioActual: number = 0;
  public idEventoActividadSeleccionada: number = 0;

  // Cache y Control de Desplegable
  public participantesCache: { [idActividad: number]: Usuario[] } = {};
  public actividadAbierta: number | null = null;
  public loadingLista: boolean = false;

  public inscripcion: Inscripcion;
  public actividadNueva: Actividad;
  public actividadEditar: Actividad;
  // Perfil
  public usuarioPerfil: Usuario | null = null;
  public rolUsuario: string = '';

  // Diccionario para guardar precios: Clave=idEventoActividad, Valor={idPrecio, precio}
  public preciosCache: { [key: number]: { idPrecio: number, precio: number } } = {};

  // Variables para Materiales
  public idEventoActividadMateriales: number = 0; // Para saber dónde guardar el nuevo
  public nuevoMaterialNombre: string = ''; // Para el input del formulario

  constructor(
    private actividadesService: ActividadesService, 
    private materialesService: MaterialesService,
    private inscripcionesService: InscripcionesService,
    private route: ActivatedRoute,
    private torneoService: ServiceTorneo,
    private dialog: MatDialog,
    private serviceTorneo: ServiceTorneo,
    private router: Router,
  ) {
    this.inscripcion = new Inscripcion(0, 0, 0, false, new Date().toISOString());
    this.actividadNueva = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
    this.actividadEditar = new Actividad(0, 0, new Date().toISOString(), 0, 0, '', 0, 0);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idEvento = +params['idEvento'];
      
      this.cargarDatos();       
      this.cargarPerfil();      
      this.cargarPrecios();     
    });
  }

  cargarDatos(): void {
    // 1. Inscripciones
    this.inscripcionesService.getInscripciones().subscribe({
      next: (data) => {
        this.inscripciones = data;
        this.agruparInscripcionesPorActividad();
      },
      error: (err) => {}
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
        this.idUsuarioActual=usuario.idUsuario //DECLARAMOS EL USUARIO ACTUAL EN CARGARPERFIL
      }
    });
  }

  // --- LÓGICA DE PRECIOS ---

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
            console.log("💰 Precios cargados (con IDs):", this.preciosCache);
        }
      },
      error: (err) => console.error("Error al cargar precios:", err)
    });
  }

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
        this.guardarPrecioEnApi(act.idEventoActividad, act.idActividad, resultado); // Pasamos también idActividad para buscar usuarios
      }
    });
  }

  borrarPrecioApi(idPrecio: number, idEventoActividad: number) {
    this.actividadesService.eliminarPrecioActividad(idPrecio).subscribe({
      next: () => {
        delete this.preciosCache[idEventoActividad];
        alert('🗑️ Precio eliminado. La actividad vuelve a ser gratis.');
      },
      error: (err) => {
        console.error(err);
        alert('❌ Error al eliminar el precio.');
      }
    });
  }

  // Lógica inteligente POST vs PUT
  // AÑADIDO: Recibe idActividad para buscar participantes
  guardarPrecioEnApi(idEventoActividad: number, idActividad: number, precio: number) {
    const registroExistente = this.preciosCache[idEventoActividad];

    if (registroExistente) {
      // --- PUT (ACTUALIZAR) ---
      console.log(`✏️ Editando precio ID: ${registroExistente.idPrecio}...`);
      
      this.actividadesService.actualizarPrecioActividad(registroExistente.idPrecio, idEventoActividad, precio)
        .subscribe({
          next: (res) => {
            this.preciosCache[idEventoActividad].precio = precio;
            alert(`✅ Precio actualizado a ${precio}€.`);
            // Aquí NO generamos recibos porque ya existirán, solo cambiamos el precio
          },
          error: (err) => {
            console.error(err);
            alert('❌ Error al actualizar el precio.');
          }
        });

    } else {
      // --- POST (CREAR) ---
      console.log(`➕ Creando nuevo precio...`);

      this.actividadesService.crearPrecioActividad(idEventoActividad, precio)
        .subscribe({
          next: (res: any) => {
            const nuevoIdPrecio = res.idPrecioActividad || 0; 
            
            this.preciosCache[idEventoActividad] = {
              idPrecio: nuevoIdPrecio,
              precio: precio
            };
            
            alert(`✅ Precio asignado correctamente.`);

            // --- AQUÍ LLAMAMOS A LA GENERACIÓN DE RECIBOS ---
            if (nuevoIdPrecio > 0) {
              this.generarRecibosPendientes(this.idEvento, idActividad, nuevoIdPrecio);
            }

            if(!nuevoIdPrecio) this.cargarPrecios(); 
          },
          error: (err) => {
            console.error(err);
            alert('❌ Error al crear el precio.');
          }
        });
    }
  }

  // --- NUEVO: GENERAR RECIBOS POR CURSO ---
  // Asegúrate de tener importado el modelo PagosCompletos también si lo necesitas, 
// o usa 'any' para la comprobación rápida.

generarRecibosPendientes(idEvento: number, idActividad: number, idPrecioActividad: number) {
    
  // PASO 1: Obtenemos los alumnos inscritos (para sacar los cursos)
    this.actividadesService.findUsuariosInscritosPorActividadEvento(idEvento, idActividad).subscribe({
      next: (usuarios) => {
        
        // Filtramos cursos únicos
        const cursosInscritos = new Set<number>();
        usuarios.forEach((u: any) => {
          if (u.idCurso && u.idCurso > 0) cursosInscritos.add(u.idCurso);
        });

        if (cursosInscritos.size === 0) return;

        // PASO 2: ¡LA CLAVE! Obtenemos los pagos que YA EXISTEN en este evento
        // Necesitas tener getPagosEvento disponible en actividadesService o serviceTorneo
        this.actividadesService.getPagosEvento(idEvento).subscribe({
          next: (pagosExistentes) => {
            
            let cursosAgenerar: number[] = [];

            // PASO 3: Comprobamos uno a uno
            cursosInscritos.forEach(idCurso => {
              // Buscamos si ya existe un pago para este Curso + Esta Actividad
              // Nota: Ajusta 'p.idActividad' o 'p.actividad' según lo que devuelva tu API de pagos
              const yaTienePago = pagosExistentes.find((p: any) => 
                p.idCurso === idCurso && p.idActividad === idActividad
              );

              // Si NO tiene pago, lo añadimos a la lista para crear
              if (!yaTienePago) {
                cursosAgenerar.push(idCurso);
              }
            });

            // Si todos ya tienen pago, avisamos y salimos
            if (cursosAgenerar.length === 0) {
              console.log("Todos los cursos inscritos ya tienen su recibo generado.");
              return;
            }

            // PASO 4: Generamos solo los que faltan
            if (confirm(`Se han detectado ${cursosAgenerar.length} cursos nuevos sin recibo. ¿Generar recibos ahora?`)) {
              cursosAgenerar.forEach(idCurso => {
                const nuevoPago = new Pagos(
                  0, idCurso, idPrecioActividad, 0, "Sin pagar"
                );

                this.actividadesService.crearPago(nuevoPago).subscribe({
                  next: () => console.log(`Recibo generado para curso ${idCurso}`),
                  error: (e) => console.error(e)
                });
              });
            }

          },
          error: (err) => console.error("Error comprobando pagos existentes", err)
        });
      }
    });
  }

  // --- NAVEGACIÓN A PAGOS ---
  irAPagosGenerales(): void {
    this.router.navigate(['/pagos', this.idEvento]);
  }

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

// --- MATERIALES (MODIFICADO) ---

  getMaterialesEventoActividad(idEventoActividad: number, nombreActividad: string): void {
    this.actividadSeleccionada = nombreActividad;
    this.idEventoActividadMateriales = idEventoActividad; 
    this.materialesEventoActividad = []; 
    this.materialesService.getMaterialesEvento(idEventoActividad).subscribe(result => {
      this.materialesEventoActividad = result;
      this.mostrarModal = true;
    })
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.materialesEventoActividad = [];
    this.nuevoMaterialNombre = ''; // Limpiamos input
  }

  // 1. CREAR SOLICITUD DE MATERIAL (Restringido a inscritos)
  crearMaterial(): void {
    if (!this.nuevoMaterialNombre.trim()) return;

    // VALIDACIÓN: ¿Está el usuario inscrito en esta actividad?
    // Verificamos si su ID está en la lista de inscripciones de esta actividad
    const listaInscritos = this.getInscripciones(this.idEventoActividadMateriales);
    const estaInscrito = listaInscritos.some(i => i.idUsuario === this.idUsuarioActual);

    // Permitimos si es Admin/Org O si está inscrito
    if (this.esAdminOOrganizador() && !estaInscrito) {
      alert("❌ Solo los participantes inscritos pueden solicitar material para esta actividad.");
      return;
    }

    const nuevoMat = new Material(
      0, 
      this.idEventoActividadMateriales, 
      this.idUsuarioActual, // Solicitante (quien crea la petición)
      this.nuevoMaterialNombre, 
      true, // Pendiente por defecto
      new Date().toISOString(), 
      0 // idUsuarioAportacion = 0 (NADIE lo ha traído aún, es una solicitud)
    );
    console.log(nuevoMat);
    this.materialesService.crearMaterial(nuevoMat).subscribe({
      next: (res) => {
        this.nuevoMaterialNombre = ''; 
        this.recargarMateriales();
        // Feedback opcional
        // alert("✅ Solicitud creada. Esperando que alguien lo aporte.");
      },
      error: (err) => alert('Error al crear solicitud de material')
    });
  }

  // 2. BORRAR MATERIAL (Solo Admin/Org)
  borrarMaterial(idMaterial: number): void {
    if(confirm('¿Eliminar este material de la lista?')) {
      this.materialesService.deleteMateriales(idMaterial).subscribe({
        next: () => this.recargarMateriales(),
        error: (err) => alert('Error al eliminar')
      });
    }
  }

  // 3. APORTAR MATERIAL (Cualquier usuario)
  aportarMaterial(material: Material): void {
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

  recargarMateriales() {
    this.materialesService.getMaterialesEvento(this.idEventoActividadMateriales).subscribe(res => {
      this.materialesEventoActividad = res;
    });
  }


  //--------MODAL INSCRIPCIÓN
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

  // FUNCIÓN CORREGIDA
  public esAdminOOrganizador(): boolean {
    return this.rolUsuario === 'ADMINISTRADOR' || this.rolUsuario === 'ORGANIZADOR';
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

  // Eliminar actividad con confirmación
  eliminarActividad(actividad: Actividad): void {
    // Verificar permisos
    if (this.rolUsuario !== 'ADMINISTRADOR' && this.rolUsuario !== 'ORGANIZADOR') {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: 'Solo los Administradores y Organizadores pueden eliminar actividades.',
        confirmButtonColor: '#d33'
      });
      return;
    }

    // Mostrar confirmación
    Swal.fire({
      title: '¿Eliminar Actividad?',
      html: `
        <p>¿Estás seguro de que deseas eliminar la actividad <strong>"${actividad.nombreActividad}"</strong>?</p>
        <p class="text-warning"><small>⚠️ Esta acción no se puede deshacer.</small></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.procesarEliminacionActividad(actividad);
      }
    });
  }

  private procesarEliminacionActividad(actividad: Actividad): void {
    Swal.fire({
      title: 'Preparando eliminación...',
      text: 'Verificando dependencias',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Paso 1: Obtener inscripciones de esta actividad
    this.actividadesService.findUsuariosInscritosPorActividadEvento(
      actividad.idEvento, 
      actividad.idActividad
    ).subscribe({
      next: (usuarios) => {
        // Filtrar inscripciones de esta actividad
        const inscripcionesActividad = this.inscripciones.filter(insc => 
          insc.idEventoActividad === actividad.idEventoActividad
        );

        // Paso 2: Eliminar inscripciones primero
        if (inscripcionesActividad.length > 0) {
          this.eliminarInscripcionesYContinuar(inscripcionesActividad, actividad);
        } else {
          // No hay inscripciones, continuar con materiales
          this.eliminarMaterialesYContinuar(actividad);
        }
      },
      error: (err) => {
        console.error('Error al obtener inscripciones:', err);
        // Continuar de todos modos
        this.eliminarMaterialesYContinuar(actividad);
      }
    });
  }

  private eliminarInscripcionesYContinuar(inscripciones: Inscripcion[], actividad: Actividad): void {
    let inscripcionesEliminadas = 0;
    const totalInscripciones = inscripciones.length;

    Swal.fire({
      title: 'Eliminando inscripciones...',
      text: `${totalInscripciones} inscripción(es) encontrada(s)`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    inscripciones.forEach(inscripcion => {
      this.inscripcionesService.eliminarInscripcion(inscripcion.idInscripcion).subscribe({
        next: () => {
          inscripcionesEliminadas++;
          if (inscripcionesEliminadas === totalInscripciones) {
            // Todas las inscripciones eliminadas, continuar con materiales
            this.eliminarMaterialesYContinuar(actividad);
          }
        },
        error: (err) => {
          console.error(`Error al eliminar inscripción ${inscripcion.idInscripcion}:`, err);
          inscripcionesEliminadas++;
          if (inscripcionesEliminadas === totalInscripciones) {
            this.eliminarMaterialesYContinuar(actividad);
          }
        }
      });
    });
  }

  private eliminarMaterialesYContinuar(actividad: Actividad): void {
    // Obtener materiales de esta actividad
    this.materialesService.getMaterialesEvento(actividad.idEventoActividad).subscribe({
      next: (materiales) => {
        if (materiales && materiales.length > 0) {
          let materialesEliminados = 0;
          const totalMateriales = materiales.length;

          Swal.fire({
            title: 'Eliminando materiales...',
            text: `${totalMateriales} material(es) encontrado(s)`,
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          materiales.forEach(material => {
            this.materialesService.deleteMateriales(material.idMaterial).subscribe({
              next: () => {
                materialesEliminados++;
                if (materialesEliminados === totalMateriales) {
                  // Todos los materiales eliminados, continuar con pagos
                  this.eliminarPagosYContinuar(actividad);
                }
              },
              error: (err) => {
                console.error(`Error al eliminar material ${material.idMaterial}:`, err);
                materialesEliminados++;
                if (materialesEliminados === totalMateriales) {
                  this.eliminarPagosYContinuar(actividad);
                }
              }
            });
          });
        } else {
          // No hay materiales, continuar con pagos
          this.eliminarPagosYContinuar(actividad);
        }
      },
      error: (err) => {
        console.error('Error al obtener materiales:', err);
        // Continuar de todos modos con pagos
        this.eliminarPagosYContinuar(actividad);
      }
    });
  }

  private eliminarPagosYContinuar(actividad: Actividad): void {
    const precioInfo = this.preciosCache[actividad.idEventoActividad];
    
    if (precioInfo && precioInfo.idPrecio > 0) {
      // Obtener los pagos del evento
      this.actividadesService.getPagosEvento(this.idEvento).subscribe({
        next: (pagosEvento) => {
          // Buscar pagos asociados a esta actividad
          const pagosActividad = pagosEvento.filter((p: any) => 
            p.idActividad === actividad.idActividad
          );

          if (pagosActividad.length > 0) {
            this.eliminarPagosYPrecio(pagosActividad, precioInfo.idPrecio, actividad);
          } else {
            // No hay pagos, solo eliminar el precio
            this.eliminarPrecioYFinalizar(precioInfo.idPrecio, actividad);
          }
        },
        error: (err) => {
          console.error('Error al obtener pagos:', err);
          // Intentar eliminar el precio directamente
          this.eliminarPrecioYFinalizar(precioInfo.idPrecio, actividad);
        }
      });
    } else {
      // No tiene precio, eliminar actividad directamente
      this.eliminarActividadFinal(actividad);
    }
  }

  private eliminarPagosYPrecio(pagos: any[], idPrecio: number, actividad: Actividad): void {
    let pagosEliminados = 0;
    const totalPagos = pagos.length;

    Swal.fire({
      title: 'Eliminando pagos...',
      text: `${totalPagos} pago(s) encontrado(s)`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    pagos.forEach(pago => {
      this.actividadesService.deletePago(pago.idPago).subscribe({
        next: () => {
          pagosEliminados++;
          if (pagosEliminados === totalPagos) {
            // Todos los pagos eliminados, eliminar el precio
            this.eliminarPrecioYFinalizar(idPrecio, actividad);
          }
        },
        error: (err) => {
          console.error(`Error al eliminar pago ${pago.idPago}:`, err);
          pagosEliminados++;
          if (pagosEliminados === totalPagos) {
            this.eliminarPrecioYFinalizar(idPrecio, actividad);
          }
        }
      });
    });
  }

  private eliminarPrecioYFinalizar(idPrecio: number, actividad: Actividad): void {
    Swal.fire({
      title: 'Eliminando precio...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.actividadesService.eliminarPrecioActividad(idPrecio).subscribe({
      next: () => {
        // Precio eliminado, ahora eliminar la actividad
        this.eliminarActividadFinal(actividad);
      },
      error: (err) => {
        console.error('Error al eliminar precio:', err);
        // Intentar eliminar la actividad de todos modos
        this.eliminarActividadFinal(actividad);
      }
    });
  }

  private eliminarActividadFinal(actividad: Actividad): void {
    Swal.fire({
      title: 'Eliminando actividad...',
      text: 'Último paso',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    this.actividadesService.eliminarActividad(actividad.idEventoActividad).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          html: `La actividad <strong>"${actividad.nombreActividad}"</strong> y todas sus dependencias han sido eliminadas correctamente.`,
          confirmButtonColor: '#3085d6',
          timer: 3000
        });

        // Limpiar cache y recargar datos
        delete this.preciosCache[actividad.idEventoActividad];
        delete this.participantesCache[actividad.idActividad];
        
        setTimeout(() => {
          this.cargarDatos();
        }, 500);
      },
      error: (err) => {
        console.error('Error al eliminar actividad:', err);
        
        let errorMsg = 'No se pudo eliminar la actividad.';
        if (err.error && err.error.message) {
          errorMsg += ` ${err.error.message}`;
        } else if (err.status === 500) {
          errorMsg += ' La actividad aún tiene dependencias en la base de datos.';
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: errorMsg,
          confirmButtonColor: '#d33'
        });
      }
    });
  }
}