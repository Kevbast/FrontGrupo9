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
  public idEvento!: number;

  // Cache y Control de Desplegable
  public participantesCache: { [idActividad: number]: Usuario[] } = {};
  public actividadAbierta: number | null = null;
  public loadingLista: boolean = false;

  // Perfil
  public usuarioPerfil: Usuario | null = null;
  public rolUsuario: string = '';

  // Diccionario para guardar precios: Clave=idEventoActividad, Valor={idPrecio, precio}
  public preciosCache: { [key: number]: { idPrecio: number, precio: number } } = {};

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