import { Component } from '@angular/core';
import { Evento } from '../../models/Evento';
import { EventosService } from '../../services/eventosService';
import Swal from "sweetalert2";
import { Usuario } from '../../models/Usuario';
import { ServiceTorneo } from '../../services/service.torneo';
declare var bootstrap: any;

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {

  public usuarioLogado!: Usuario
  public eventos!: Array<Evento>
  public eventosDisponibles!: Array<Evento>
  public eventosTranscurridosMismoYear!: Array<Evento>
  //Necesario para poder asignar profesores a un evento
  public profesoresActivosSinEvento!: Array<Usuario>
  public nuevoEvento: Evento = new Evento(0, '', -1);
  public eventoEditar: Evento = new Evento(0, '', 0);
  private modalInstance: any;
  private modalInstanceEditar: any;

  constructor(private _service: EventosService, private _serviceTorneo: ServiceTorneo){}

  ngOnInit(): void {
    this._service.getEventos().subscribe(result => {
      this.eventos = result;
      this.filtrarEventosDisponibles();
      this.filtrarEventosTranscurridosMismoYear();
    })

    this._serviceTorneo.getPerfil().subscribe(result => {
      this.usuarioLogado = result;
      console.log(this.usuarioLogado);
    })
  }

  cargarEventos(): void {
    this._service.getEventos().subscribe(result => {
      this.eventos = result;
      this.filtrarEventosDisponibles();
      this.filtrarEventosTranscurridosMismoYear();
    })
  }

  //METODO PARA OBTENER LOS EVENTOS DISPONIBLES PARA INSCRIBIRSE, ES DECIR, QUE SU FECHAEVENTO NO HAYA PASADO.
  filtrarEventosDisponibles(): void {
    const fechaActual = new Date();
    this.eventosDisponibles = this.eventos.filter(evento => {
      const fechaEvento = new Date(evento.fechaEvento);
      return fechaEvento >= fechaActual;
    });
  }

  //METODO PARA OBTENER LOS EVENTOS YA TRANSCURRIDOS EL MISMO AÑO
  filtrarEventosTranscurridosMismoYear(): void {
    const fechaActual = new Date();
    this.eventosTranscurridosMismoYear = this.eventos.filter(evento => {
      const fechaEvento = new Date(evento.fechaEvento);
      return fechaEvento < fechaActual && fechaEvento.getFullYear() == fechaActual.getFullYear()
    });
  }

  //OBTENER LOS PROFESORES ACTIVOS SIN EVENTO 
  getProfesoresSinEvento(): void {
    this._service.getProfesoresActivosSinEvento().subscribe(result => {
      this.profesoresActivosSinEvento = result;
      console.log('Profesores sin evento:', this.profesoresActivosSinEvento);
    })
  }

  //METODOS DE MODALES
  abrirModalCrearEvento(): void {
    const modalElement = document.getElementById('modalCrearEvento');
    this.modalInstance = new bootstrap.Modal(modalElement);
    this.nuevoEvento = new Evento(0, '', 0);
    this.modalInstance.show();
  }

  abrirModalEditarEvento(evento: Evento): void {
    this.getProfesoresSinEvento();
    const modalElement = document.getElementById('modalEditarEvento');
    this.modalInstanceEditar = new bootstrap.Modal(modalElement);
    this.eventoEditar = { ...evento };
    this.modalInstanceEditar.show();
  }

  //METODOS CRUD
  crearEvento(): void {
    if (!this.nuevoEvento.fechaEvento) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor asigne una fecha',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this._service.createEvento(this.nuevoEvento).subscribe({
      next: (result) => {
        this.modalInstance.hide();
        Swal.fire({
          title: '¡Listo!',
          text: 'Evento creado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        this.cargarEventos();
      },
      error: (error) => {
        console.error('Error al crear evento:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo crear el evento. Intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  editarEvento(): void {
    if (!this.eventoEditar.fechaEvento || !this.eventoEditar.idProfesor) {
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor complete todos los campos',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this._service.updateEvento(this.eventoEditar).subscribe({
      next: (result) => {
        this.modalInstanceEditar.hide();
        Swal.fire({
          title: '¡Éxito!',
          text: 'Evento actualizado correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar'
        });
        this.cargarEventos();
      },
      error: (error) => {
        console.error('Error al editar evento:', error);
        Swal.fire({
          title: 'Error',
          text: 'No se pudo actualizar el evento. Intente nuevamente.',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  borrarEvento(idEvento: number): void {
    Swal.fire({
      title: '¡Un momento!',
      text: 'Estas a punto de eliminar un registro, ¿Seguro que quieres continuar?',
      icon: 'warning',
      confirmButtonText: 'Sí',
      confirmButtonColor: 'red',
      showCancelButton: true,
      cancelButtonText: 'Volver'
    }).then((result) => {
      if(result.isConfirmed){
        this._service.deleteEvento(idEvento).subscribe(result => {
          Swal.fire({
            title: '¡Listo!',
            icon: "success",
            text: "Evento eliminado correctamente",
            confirmButtonText: "Volver"
          });
          this.cargarEventos();
        })
      }
    })
    
  }
}
