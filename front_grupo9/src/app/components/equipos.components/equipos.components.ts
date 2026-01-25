import { Component, OnInit } from '@angular/core';
import { Equipo } from '../../models/Equipo';
import { EquiposService } from '../../services/equiposService';
import { ActivatedRoute, Router } from '@angular/router';
import { Usuario } from '../../models/Usuario';
import { UsuariosService } from '../../services/usuariosService';
import { Curso } from '../../models/Curso';
import { Color } from '../../models/Color';
import { ServiceTorneo } from '../../services/service.torneo';
import { MiembroEquipos } from '../../models/MiembrosEquipo';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { Evento } from '../../models/Evento';
import { DatePipe } from '@angular/common';
import { CapitanActividad } from '../../models/CapitanActividad';

@Component({
  selector: 'app-equipos.components',
  standalone: false,
  templateUrl: './equipos.components.html',
  styleUrl: './equipos.components.css',
})
export class EquiposComponents implements OnInit {
  //EQUIPOS DE LA ACTIVIDAD EVENTO
  public equiposActividadEvento!: Array<Equipo>;
  //COMPRUEBA SI EL USUARIO LOGADO ES CAPITAN DE ESE MISMO EVENTOACTIVIDAD
  public esCapitan!: boolean;
  public usuarioLogado!: Usuario;
  public idEventoActividad!: number;
  public jugadoresEquipo: Array<Usuario> = [];
  public miembroEquipos!: Array<MiembroEquipos>;
  public participantesInscritos!: Array<Usuario>;
  public listaCursosActivos!: Array<Curso>;
  public listaColores: Array<Color> = [];
  public idActividad!: number;
  public idEvento!: number;
  public equipoAbierto: number | null = null;
  public loadingJugadores: boolean = false;
  public participanteSeleccionado!: Usuario;
  public equipoSeleccionado: number | string = '';
  // Variables para crear nuevo equipo
  public nuevoEquipo = {
    nombreEquipo: '',
    minimoJugadores: 0,
    idColor: 0,
    idCurso: 0
  };
  // Variables para editar equipo
  public equipoAEditar!: Equipo;
  public editarEquipo = {
    nombreEquipo: '',
    idColor: 0,
    minimoJugadores: 0
  };
  public coloresDisponiblesEdicion: Array<Color> = [];
  public todosLosColores: Array<Color> = [];
  public coloresDisponibles: Array<Color> = [];
  public eventoActual!: Evento; 
  public inscripcionesQuiereCapitan!: Array<Usuario>;
  public inscripcionesEventoActividad!: Array<Usuario>;

  constructor(private _serviceEquipo: EquiposService, private _serviceUsuario: UsuariosService, private _serviceTorneo: ServiceTorneo, private _route: ActivatedRoute){}

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.idActividad = +params['idActividad'];
      this.idEvento = +params['idEvento'];
      
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    // Usar forkJoin para esperar a que todas las llamadas se completen
    forkJoin({
      equipos: this._serviceEquipo.getEquiposActividadEvento(this.idActividad, this.idEvento),
      participantes: this._serviceUsuario.getUsuariosInscritosEventoActividad(this.idEvento, this.idActividad),
      cursos: this._serviceEquipo.getCursosActivos(),
      miembros: this._serviceEquipo.getMiembrosEquipo(),
      colores: this._serviceEquipo.getColores(),
      eventoActividad: this._serviceEquipo.getEventoActividad(this.idEvento, this.idActividad),
      perfil: this._serviceTorneo.getPerfil(),
      eventoActual: this._serviceEquipo.getEvento(this.idEvento),
      inscripcionesQuiereCapitan: this._serviceEquipo.getInscripcionesQuiereCapitan(this.idEvento, this.idActividad),
      inscripcionesEventoActividad: this._serviceEquipo.getInscripcionesEventoActividad(this.idEvento, this.idActividad)
    }).subscribe({
      next: (resultado) => {
        // Asignar resultados
        this.equiposActividadEvento = resultado.equipos;
        this.participantesInscritos = resultado.participantes;
        this.listaCursosActivos = resultado.cursos;
        this.miembroEquipos = resultado.miembros;
        this.todosLosColores = resultado.colores;
        this.idEventoActividad = Number(resultado.eventoActividad.idEventoActividad);
        this.usuarioLogado = resultado.perfil;
        this.eventoActual = resultado.eventoActual;
        this.inscripcionesQuiereCapitan = resultado.inscripcionesQuiereCapitan;
        this.inscripcionesEventoActividad = resultado.inscripcionesEventoActividad;

        // Cargar colores únicos de los equipos
        this.listaColores = [];
        const coloresUnicos = new Set(resultado.equipos.map(e => e.idColor));
        coloresUnicos.forEach(idColor => {
          const color = resultado.colores.find(c => c.idColor === idColor);
          if (color) {
            this.listaColores.push(color);
          }
        });

        // Actualizar colores disponibles
        this.actualizarColoresDisponibles();

        // Verificar si es capitán
        this._serviceEquipo.getCapitanByIdEventoActividad(this.idEventoActividad).subscribe(capitan => {
          if ((capitan != null || capitan != undefined) && capitan.idUsuario == this.usuarioLogado.idUsuario) {
            this.esCapitan = true;
          }
        });

        //DISPARADOR QUE EJECUTARA ASIGNAR CAPITAN RANDOM SI LA FECHA ACTUAL
        //ES TRES DIAS ANTES AL EVENTO
        if(this.isFechaTresDiasAntes() == true){
          this.randomCapitanEventoActividad();
        }

      },
      error: (error) => {
        console.error('Error al cargar los datos:', error);
        Swal.fire({
          title: "Error",
          text: "No se pudieron cargar los datos correctamente",
          icon: "error",
          confirmButtonText: "Cerrar"
        });
      }
    });
  }

  //METODO DISPARADOR PARA HACER CAPITAN, COMPRUEBA SI LA FECHA ACTUAL ES TRES DIAS ANTES DEL EVENTO PARA 
  //ASIGNAR UN CAPITAN
  isFechaTresDiasAntes(): boolean {
    let fechaEvento = new Date(this.eventoActual.fechaEvento);
    let tresDiasAntes = new Date(fechaEvento);
    tresDiasAntes.setDate(fechaEvento.getDate() - 3);
    let fechaActual = new Date();

    tresDiasAntes.setHours(0, 0, 0, 0);
    fechaActual.setHours(0, 0, 0, 0);

    if (fechaActual.getTime() === tresDiasAntes.getTime()) {
      return true;
    }
    return false;
  }

  randomCapitanEventoActividad(): void {
    let usuarioElegido;

    //SI HAY MAS DE UNA INSCRIPCION QUE QUIERE SER CAPITAN
    if(this.inscripcionesQuiereCapitan.length > 1) {
      const randomIndex = Math.floor(Math.random() * this.inscripcionesQuiereCapitan.length);
      usuarioElegido = this.inscripcionesQuiereCapitan[randomIndex];
      console.log("Elegido por inscripciones que querian");

    } else if(this.inscripcionesQuiereCapitan.length == 1){ //SI SOLO HAY UNA INSCRIPCION QUE QUIERE SER CAPITAN
      usuarioElegido = this.inscripcionesQuiereCapitan[0];
      console.log("Elegido por el unico que queria");

    } else {
      //RANDOM ENTRE TODOS LOS INSCRITOS, SOLO ENTRA SI NADIE HA ELEGIDO SER CAPITAN
      const randomIndex = Math.floor(Math.random() * this.inscripcionesEventoActividad.length);
      usuarioElegido = this.inscripcionesEventoActividad[randomIndex];
      console.log("Elegido por inscripciones que no querian");
    }

    //CREACION DEL OBJETO A ENVIAR
    let nuevoCapitan = new CapitanActividad (
      0,
      this.idEventoActividad,
      usuarioElegido.idUsuario
    )

    //ASIGNACION DE CAPITAN
    this._serviceEquipo.asignarCapitan(nuevoCapitan).subscribe(result => {
      if(this.usuarioLogado.idUsuario == usuarioElegido.idUsuario){
        Swal.fire({
          title: "¡Felicidades!",
          text: "Has sido elegido como capitán de esta actividad",
          icon: "success",
          confirmButtonText: "Aceptar"
        });
      }
    })

  }

  //METODO PARA OBTENER EL STRING NOMBRE CURSO A PARTIR DE SU ID PARA MOSTRARLO EN EL EQUIPO
  getNombreCursoPorId(idCurso: number): string {
    let cursoString = "";
    this.listaCursosActivos.forEach(curso => {
      if(curso.idCurso == idCurso) {
        cursoString = curso.nombre;
      } 
    });
    return cursoString;
  }

  //METODO PARA OBTENER EL COLOR DE LA EQUIPACION DE UN EQUIPO
  getNombreColorPorId(idColor: number): string {
    const color = this.listaColores.find(c => c.idColor === idColor);
    if (color && color.nombreColor) {
      //CAMBIAR LA PRIMERA LETRA DEL COLOR A MAYUSCULA (POR SI NO LO ESTÁ)
      return color.nombreColor.charAt(0).toUpperCase() + color.nombreColor.slice(1);
    }
    return 'Cargando...';
  }

  toggleJugadores(idEquipo: number): void {
    if (this.equipoAbierto === idEquipo) {
      this.equipoAbierto = null;
      this.jugadoresEquipo = [];
    } else {
      this.equipoAbierto = idEquipo;
      this.loadingJugadores = true;
      
      this._serviceEquipo.getJugadoresEquipo(idEquipo).subscribe(result => {
        this.jugadoresEquipo = result;
        this.loadingJugadores = false;
        console.log('Jugadores del equipo', idEquipo, ':', result);
      });
    }
  }

  estaEnEquipo(): boolean {
    
    // Obtener todos los IDs de equipos de esta actividad/evento
    const idsEquiposActividadEvento = this.equiposActividadEvento.map(equipo => equipo.idEquipo);
    
    // Verificar si el usuario logado está en alguno de estos equipos
    return this.miembroEquipos.some(miembro => 
      miembro.idUsuario === this.usuarioLogado.idUsuario && 
      idsEquiposActividadEvento.includes(miembro.idEquipo)
    );
  }

  //METODO PARA COMPROBAR SI EL USUARIO LOGADO ESTÁ INSCRITO EN EL EVENTO ACTIVIDAD
  estaInscrito(): boolean {
    if (!this.usuarioLogado || !this.participantesInscritos) {
      return false;
    }
    return this.participantesInscritos.some(participante => 
      participante.idUsuario === this.usuarioLogado.idUsuario
    );
  }

  //METODO PARA QUE EL USUARIO LOGADO SE UNA A UN EQUIPO
  unirseEquipo(idEquipo: number): void {
    Swal.fire({
      title: "Aviso",
      text: "Estas a punto de unirte a un equipo, solo el capitan puede cambiarte de equipo si deseas. ¿Estás seguro?",
      icon: "warning",
      confirmButtonText: "Unirse a equipo",
      confirmButtonColor: "blue",
      showCancelButton: true,
      cancelButtonText: "Volver"
    }).then((result) => {
      if(result.isConfirmed) {
        this._serviceEquipo.unirseEquipo(idEquipo).subscribe(result => {
          Swal.fire({
            title: "¡Listo!",
            text: "Te has unido correctamente al equipo, bienvenido",
            icon: "success",
            confirmButtonText: "Cerrar"
          }).then(() => {
            this.cargarDatos();
            window.location.reload();
          })
        })
      }
    })
  }

  abrirModalFichar(participante: Usuario): void {
    this.participanteSeleccionado = participante;
    this.equipoSeleccionado = '';
    
    // Abrir modal usando Bootstrap
    const modalElement = document.getElementById('modalFichar');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  ficharJugador(): void {
    
    let idParticipanteElegido = this.participanteSeleccionado.idUsuario;
    let idEquipoElegido = Number(this.equipoSeleccionado);
    
    // Obtener todos los IDs de equipos de esta actividad/evento
    const idsEquiposActividadEvento = this.equiposActividadEvento.map(equipo => equipo.idEquipo);
    
    // Verificar si el jugador ya está en CUALQUIER equipo de esta actividad
    let estaYaApuntado = false;
    this.miembroEquipos.forEach(miembro => {
      if(miembro.idUsuario == idParticipanteElegido && idsEquiposActividadEvento.includes(miembro.idEquipo)){
        estaYaApuntado = true;
      }
    });
    
    if(estaYaApuntado == false){
      this._serviceEquipo.apuntarParticipante(idParticipanteElegido, idEquipoElegido).subscribe(result => {
        Swal.fire({
        title: "Inserción completada",
        text: "El jugador ha sido añadido al equipo",
        icon: "success",
        confirmButtonText: "Confirmar"
      }).then(() => {
        this.cargarDatos();
      });
      })
    } else {
      Swal.fire({
        title: "Error",
        text: "El jugador ya está fichado en otro equipo de esta actividad",
        icon: "error",
        confirmButtonText: "Volver"
      })
    }
    
    
    // Cerrar modal
    const modalElement = document.getElementById('modalFichar');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  getMiembrosEquipo(): Array<MiembroEquipos> {
    let miembrosEquipos!: Array<MiembroEquipos>
    return miembrosEquipos;
  }

  eliminarJugadorEquipo(idUsuario: number, idEquipo: number){
      this.miembroEquipos.forEach(miembro => {
        if(miembro.idUsuario == idUsuario && miembro.idEquipo == idEquipo){
          this._serviceEquipo.eliminarMiembroEquipo(miembro.idMiembroEquipo).subscribe(result => {
            Swal.fire({
              title: "Jugador eliminado",
              text: "El jugador ha sido eliminado del equipo correctamente",
              icon: "success",
              confirmButtonText: "Confirmar"
            }).then(() => {
              this.cargarDatos();
              window.location.reload();
            });
          });
        }
      });   
  }
  // Método para actualizar colores disponibles (excluir los ya usados)
  actualizarColoresDisponibles(): void {
    const coloresUsados = this.equiposActividadEvento?.map(equipo => equipo.idColor) || [];
    this.coloresDisponibles = this.todosLosColores.filter(color => !coloresUsados.includes(color.idColor));
  }

  // Abrir modal de crear equipo
  abrirModalCrearEquipo(): void {
    this.nuevoEquipo = {
      nombreEquipo: '',
      minimoJugadores: 0,
      idColor: 0,
      idCurso: 0
    };
    this.actualizarColoresDisponibles();
    
    const modalElement = document.getElementById('modalCrearEquipo');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // Crear nuevo equipo
  crearEquipo(): void {
    const equipo = new Equipo(
      0,
      this.idEventoActividad,
      this.nuevoEquipo.nombreEquipo,
      this.nuevoEquipo.minimoJugadores,
      this.nuevoEquipo.idColor,
      this.nuevoEquipo.idCurso
    );

    this._serviceEquipo.createEquipo(equipo).subscribe(result => {
      Swal.fire({
        title: "Equipo creado",
        text: "El equipo ha sido creado exitosamente",
        icon: "success",
        confirmButtonText: "Confirmar"
      }).then(() => {
        this.cargarDatos();
      });
    }, error => {
      Swal.fire({
        title: "Error",
        text: "No se pudo crear el equipo",
        icon: "error",
        confirmButtonText: "Volver"
      });
    });
    
    // Cerrar modal
    const modalElement = document.getElementById('modalCrearEquipo');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  eliminarEquipo(idEquipo: number): void {
    Swal.fire({
      title: "¡Espera!",
      text: "¿Quieres eliminar el equipo?",
      icon: "warning",
      confirmButtonText: "Confirmar",
      confirmButtonColor: "red",
      showCancelButton: true,
      cancelButtonText: "Volver"
    }).then((result) => {
      if(result.isConfirmed){
        this._serviceEquipo.eliminarEquipo(idEquipo).subscribe(result => {
          Swal.fire({
              title: "Equipo eliminado",
              text: "El equipo ha sido eliminado correctamente",
              icon: "success",
              confirmButtonText: "Confirmar"
            }).then(() => {
              this.cargarDatos();
            });
        })
      }
    })
  }

  // Abrir modal de editar equipo
  abrirModalEditarEquipo(equipo: Equipo): void {
    this.equipoAEditar = equipo;
    this.editarEquipo = {
      nombreEquipo: equipo.nombreEquipo,
      idColor: equipo.idColor,
      minimoJugadores: equipo.minimoJugadores
    };
    
    // Obtener colores disponibles (excluir los ya usados EXCEPTO el color actual del equipo)
    const coloresUsados = this.equiposActividadEvento
      .filter(e => e.idEquipo !== equipo.idEquipo)
      .map(e => e.idColor);
    
    this.coloresDisponiblesEdicion = this.todosLosColores.filter(
      color => !coloresUsados.includes(color.idColor)
    );
    
    const modalElement = document.getElementById('modalEditarEquipo');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // Actualizar equipo
  actualizarEquipoModal(): void {
    const equipoActualizado = new Equipo(
      this.equipoAEditar.idEquipo,
      this.equipoAEditar.idEventoActividad,
      this.editarEquipo.nombreEquipo,
      this.editarEquipo.minimoJugadores,
      this.editarEquipo.idColor,
      this.equipoAEditar.idCurso
    );

    this._serviceEquipo.actualizarEquipo(equipoActualizado).subscribe({
      next: (result) => {
        Swal.fire({
          title: "Equipo actualizado",
          text: "El equipo ha sido actualizado exitosamente",
          icon: "success",
          confirmButtonText: "Confirmar"
        }).then(() => {
          this.cargarDatos();
        });
      },
      error: (error) => {
        Swal.fire({
          title: "Error",
          text: "No se pudo actualizar el equipo",
          icon: "error",
          confirmButtonText: "Volver"
        });
      }
    });
    
    // Cerrar modal
    const modalElement = document.getElementById('modalEditarEquipo');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }


}
