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
  
  public rolUsuario: string = ''; 
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
  
  // Diccionario para guardar precios
  public preciosCache: { [key: number]: { idPrecio: number, precio: number } } = {};

  // Variables para Materiales
  public idEventoActividadMateriales: number = 0; 
  public nuevoMaterialNombre: string = ''; 
  // Map to store current activity ID for materials to check participants
  public idActividadParaMateriales: number = 0;

  constructor(
    private actividadesService: ActividadesService, 
    private materialesService: MaterialesService,
    private inscripcionesService: InscripcionesService,
    private route: ActivatedRoute,
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
      },
      error: (err) => console.error('Error actividades:', err)
    });
  }

  cargarPerfil(): void {
    this.serviceTorneo.getPerfil().subscribe({
      next: (usuario) => {
        this.usuarioPerfil = usuario;
        this.rolUsuario = usuario.role; 
        this.idUsuarioActual = usuario.idUsuario; 
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
        this.guardarPrecioEnApi(act.idEventoActividad, act.idActividad, resultado); 
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
            console.error(err);
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
            console.error(err);
            alert('❌ Error al crear el precio.');
          }
        });
    }
  }

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
              console.log("Todos los cursos inscritos ya tienen su recibo generado.");
              return;
            }

            if (confirm(`Se han detectado ${cursosAgenerar.length} cursos nuevos sin recibo. ¿Generar recibos ahora?`)) {
              cursosAgenerar.forEach(idCurso => {
                const nuevoPago = new Pagos(0, idCurso, idPrecioActividad, 0, "Sin pagar");
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

  // Se añade el parámetro idActividad para poder buscar inscritos
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

  cerrarModal(): void {
    this.mostrarModal = false;
    this.materialesEventoActividad = [];
    this.nuevoMaterialNombre = ''; 
  }

  // 1. CREAR SOLICITUD DE MATERIAL (Restringido a inscritos)
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

  // 2. BORRAR MATERIAL (Solo Admin/Org o Creador)
  borrarMaterial(idMaterial: number): void {
    if(confirm('¿Eliminar este material de la lista?')) {
      this.materialesService.deleteMateriales(idMaterial).subscribe({
        next: () => this.recargarMateriales(),
        error: (err) => alert('Error al eliminar')
      });
    }
  }

  // 3. APORTAR MATERIAL (Solo inscritos)
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

  recargarMateriales() {
    this.materialesService.getMaterialesEvento(this.idEventoActividadMateriales).subscribe(res => {
      this.materialesEventoActividad = res;
    });
  }

  //--------MODAL INSCRIPCIÓN, ETC... (RESTO IGUAL)
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
}