import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PartidoResultadoService } from '../../services/partidoResultadoService';
import { EquiposService } from '../../services/equiposService';
import { PartidoResultado } from '../../models/PartidoResultado';
import { Equipo } from '../../models/Equipo';
import { Usuario } from '../../models/Usuario';
import { ServiceTorneo } from '../../services/service.torneo';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-resultados',
  standalone: false,
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.css'],
})
export class ResultadosComponent implements OnInit {
  public partidos: PartidoResultado[] = [];
  public equipos: Equipo[] = [];
  public equiposMap: { [id: number]: string } = {};
  public idEventoActividad!: number;
  public idActividad!: number;
  public idEvento!: number;
  public loading: boolean = true;
  public showModalCrear: boolean = false;
  public showModalEditar: boolean = false;
  public nuevoPartido: PartidoResultado = new PartidoResultado(0, 0, 0, 0, 0, 0);
  public partidoEditar: PartidoResultado = new PartidoResultado(0, 0, 0, 0, 0, 0);
  public usuarioPerfil: Usuario | null = null;
  public esCapitan: boolean = false;

  constructor(
    private partidoService: PartidoResultadoService,
    private equiposService: EquiposService,
    private route: ActivatedRoute,
    private serviceTorneo: ServiceTorneo
  ) {}

  ngOnInit(): void {
    this.loading = true;
    
    this.route.params.subscribe(params => {
      this.idActividad = +params['idActividad'];
      this.idEvento = +params['idEvento'];
      
      // Cargar todos los datos en paralelo con forkJoin
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.loading = true;
    
    if (this.idActividad > 0 && this.idEvento > 0) {
      // Primero cargar perfil y equipos en paralelo
      forkJoin({
        perfil: this.serviceTorneo.getPerfil(),
        equipos: this.equiposService.getEquiposActividadEvento(this.idActividad, this.idEvento)
      }).pipe(
        switchMap((resultado) => {
          // Guardar usuario y equipos
          this.usuarioPerfil = resultado.perfil;
          this.equipos = resultado.equipos;
          
          // Crear mapa de equipos
          this.equipos.forEach(equipo => {
            this.equiposMap[equipo.idEquipo] = equipo.nombreEquipo;
          });
          
          // Obtener idEventoActividad del primer equipo
          if (resultado.equipos.length > 0 && resultado.equipos[0].idEventoActividad) {
            this.idEventoActividad = resultado.equipos[0].idEventoActividad;
            
            // Ahora cargar partidos y capitán en paralelo
            return forkJoin({
              partidos: this.partidoService.getPartidosPorActividad(this.idEventoActividad),
              capitan: this.equiposService.getCapitanByIdEventoActividad(this.idEventoActividad)
            });
          } else {
            throw new Error('No hay equipos para esta actividad');
          }
        })
      ).subscribe({
        next: (resultado) => {
          // Guardar partidos
          this.partidos = resultado.partidos;
          
          // Verificar si es capitán
          if (resultado.capitan && resultado.capitan.idUsuario === this.usuarioPerfil?.idUsuario) {
            this.esCapitan = true;
          } else {
            this.esCapitan = false;
          }
          
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
        }
      });
    } else {
      this.loading = false;
    }
  }

  cargarPartidos(): void {
    this.partidoService.getPartidosPorActividad(this.idEventoActividad).subscribe({
      next: (partidos) => {
        this.partidos = partidos;
      },
      error: (err) => {
      }
    });
  }

  verificarCapitan(): void {
    if (!this.usuarioPerfil || !this.idEventoActividad) {
      this.esCapitan = false;
      return;
    }

    this.equiposService.getCapitanByIdEventoActividad(this.idEventoActividad).subscribe({
      next: (capitan) => {
        if (capitan && capitan.idUsuario === this.usuarioPerfil?.idUsuario) {
          this.esCapitan = true;
        } else {
          this.esCapitan = false;
        }
      },
      error: (err) => {
        this.esCapitan = false;
      }
    });
  }

  getNombreEquipo(idEquipo: number): string {
    return this.equiposMap[idEquipo] || `Equipo #${idEquipo}`;
  }

  abrirModalCrearPartido(): void {
    // Si no hay idEventoActividad válido, establecer en 0 para que se pueda ingresar manualmente
    const eventoActividadId = this.idEventoActividad || 0;
    this.nuevoPartido = new PartidoResultado(0, eventoActividadId, 0, 0, 0, 0);
    this.showModalCrear = true;
  }

  cerrarModalCrear(): void {
    this.showModalCrear = false;
  }

  crearPartido(): void {
    // Verificar que sea capitán
    if (!this.esCapitan) {
      alert('No tienes permisos para crear partidos. Solo los Capitanes pueden hacerlo.');
      return;
    }

    if (this.nuevoPartido.idEventoActividad === 0) {
      alert('Error: No hay un evento-actividad asociado. Por favor, accede desde una actividad específica.');
      return;
    }

    if (this.nuevoPartido.idEquipoLocal === 0 || this.nuevoPartido.idEquipoVisitante === 0) {
      alert('Por favor, selecciona ambos equipos');
      return;
    }

    if (this.nuevoPartido.idEquipoLocal === this.nuevoPartido.idEquipoVisitante) {
      alert('Los equipos deben ser diferentes');
      return;
    }

    this.partidoService.crearPartido(this.nuevoPartido).subscribe({
      next: (response) => {
        alert('Partido creado correctamente');
        this.cerrarModalCrear();
        this.cargarPartidos();
      },
      error: (err) => {
        alert('Error al crear el partido: ' + (err.error?.message || err.message || 'Error desconocido'));
      }
    });
  }

  editarPartido(partido: PartidoResultado): void {
    if (!this.esCapitan) {
      alert('No tienes permisos para editar partidos. Solo los Capitanes pueden hacerlo.');
      return;
    }

    // Copiar los datos del partido a editar
    this.partidoEditar = { ...partido };
    this.showModalEditar = true;
  }

  cerrarModalEditar(): void {
    this.showModalEditar = false;
  }

  actualizarPartido(): void {
    if (!this.esCapitan) {
      alert('No tienes permisos para actualizar partidos. Solo los Capitanes pueden hacerlo.');
      return;
    }

    if (this.partidoEditar.idEquipoLocal === 0 || this.partidoEditar.idEquipoVisitante === 0) {
      alert('Por favor, selecciona ambos equipos');
      return;
    }

    if (this.partidoEditar.idEquipoLocal === this.partidoEditar.idEquipoVisitante) {
      alert('Los equipos deben ser diferentes');
      return;
    }

    this.partidoService.actualizarPartido(this.partidoEditar).subscribe({
      next: (response) => {
        alert('Partido actualizado correctamente');
        this.cerrarModalEditar();
        this.cargarPartidos();
      },
      error: (err) => {
        alert('Error al actualizar el partido: ' + (err.error?.message || err.message || 'Error desconocido'));
      }
    });
  }

  eliminarPartido(idPartidoResultado: number): void {
    if (!this.esCapitan) {
      alert('No tienes permisos para eliminar partidos. Solo los Capitanes pueden hacerlo.');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este partido? Esta acción no se puede deshacer.')) {
      return;
    }

    this.partidoService.eliminarPartido(idPartidoResultado).subscribe({
      next: (response) => {
        alert('Partido eliminado correctamente');
        this.cargarPartidos();
      },
      error: (err) => {
        alert('Error al eliminar el partido: ' + (err.error?.message || err.message || 'Error desconocido'));
      }
    });
  }
}
