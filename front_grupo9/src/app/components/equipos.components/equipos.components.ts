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
  public nombreColorNuevo: string = '';
  // Variables para crear nuevo equipo
  public nuevoEquipo = {
    nombreEquipo: '',
    minimoJugadores: 0,
    idColor: 0,
    idCurso: 0
  };
  public todosLosColores: Array<Color> = [];
  public coloresDisponibles: Array<Color> = [];

  constructor(private _serviceEquipo: EquiposService, private _serviceUsuario: UsuariosService, private _serviceTorneo: ServiceTorneo, private _route: ActivatedRoute){}

  ngOnInit(): void {
    this._route.params.subscribe(params => {
      this.idActividad = +params['idActividad'];
      this.idEvento = +params['idEvento'];
      
      this._serviceEquipo.getEquiposActividadEvento(this.idActividad, this.idEvento).subscribe(result => {
        this.equiposActividadEvento = result;
        console.log('Equipos obtenidos:', result);
        
        // Cargar colores de cada equipo
        result.forEach(equipo => {
          if (equipo.idColor && !this.listaColores.find(c => c.idColor === equipo.idColor)) {
            this._serviceEquipo.getColorById(equipo.idColor).subscribe(color => {
              this.listaColores.push(color);
            });
          }
        });
      });

      this._serviceUsuario.getUsuariosInscritosEventoActividad(this.idEvento, this.idActividad).subscribe(result => {
        this.participantesInscritos = result;
        console.log("Participantes obtenidos:", result);
      });

      this._serviceEquipo.getCursosActivos().subscribe(result => {
        this.listaCursosActivos = result;
      });

      this._serviceEquipo.getMiembrosEquipo().subscribe(result => {
        this.miembroEquipos = result;
      });

      // Cargar todos los colores
      this._serviceEquipo.getColores().subscribe(result => {
        this.todosLosColores = result;
        this.actualizarColoresDisponibles();
      });


      //METODO PARA OBTENER EL EVENTOACTIVIDAD, NECESARIO PARA COMPROBAR CAPITAN
      this._serviceEquipo.getEventoActividad(this.idEvento, this.idActividad).subscribe(result => {
        this.idEventoActividad = Number(result.idEventoActividad);
      });

      //METODO DE OBTENCION DE USUARIO LOGADO
      this._serviceTorneo.getPerfil().subscribe(result => {
        this.usuarioLogado = result;
        console.log(this.usuarioLogado);

        //OBTENCION DE TODOS LOS CAPITANES, POCO OPTIMO. NECESITA ESTAR AQUI
        //PARA PODER COMPROBAR CON this.usuarioLogado.idUsuario
        this._serviceEquipo.getCapitanes().subscribe(result => {
          result.forEach(capitan => {
            if(capitan.idUsuario == this.usuarioLogado.idUsuario && capitan.idEventoActividad == this.idEventoActividad){
              this.esCapitan = true
            } else {
            }
          });
          console.log(this.esCapitan);
        });

      });

    });
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
        window.location.reload();
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
              window.location.reload();
            });
          });
        }
      });   
  }

  crearColor(): void {
    console.log('Creando color:', this.nombreColorNuevo);
    
    this._serviceEquipo.crearColor(this.nombreColorNuevo).subscribe(result => {
      alert("Hecho");
    })
    
    // Cerrar modal
    const modalElement = document.getElementById('modalCrearColor');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  abrirModalCrearColor(): void {
    this.nombreColorNuevo = '';
    
    // Abrir modal usando Bootstrap
    const modalElement = document.getElementById('modalCrearColor');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
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
        window.location.reload();
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
              window.location.reload();
            });
        })
      }
    })
  }


}
