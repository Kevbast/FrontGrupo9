import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PartidoResultadoService } from '../../services/partidoResultadoService';
import { EquiposService } from '../../services/equiposService';
import { PartidoResultado } from '../../models/PartidoResultado';
import { Equipo } from '../../models/Equipo';
import { Usuario } from '../../models/Usuario';
import { ServiceTorneo } from '../../services/service.torneo';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-resultados',
  standalone: false,
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.css'],
})
export class ResultadosComponent implements OnInit, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartVictoriasCanvas') chartVictoriasCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;
  private chartVictorias: Chart | null = null;
  
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

  ngAfterViewInit(): void {
    // El gráfico se creará después de cargar los datos
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
          // Crear los gráficos después de cargar los datos
          setTimeout(() => {
            this.crearGrafico();
            this.crearGraficoVictorias();
          }, 100);
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
        Swal.fire({
          title: "¡Listo!",
          text: "El resultado del partido se ha registrado",
          confirmButtonText: "Volver",
          icon: 'success'
        }).then(() => {
          this.cerrarModalCrear();
          this.cargarPartidos();
          window.location.reload();
        })
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
        Swal.fire({
          title: "¡Listo!",
          text: "El resultado del partido se ha actualizado correctamente",
          confirmButtonText: "Volver",
          icon: 'success'
        }).then(() => {
          this.cerrarModalCrear();
          this.cargarPartidos();
          window.location.reload();
        })
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
        Swal.fire({
          title: "¡Listo!",
          text: "El resultado ha sido eliminado del registro",
          confirmButtonText: "Volver",
          icon: 'success'
        }).then(() => {
          this.cargarPartidos();
        })
      },
      error: (err) => {
        alert('Error al eliminar el partido: ' + (err.error?.message || err.message || 'Error desconocido'));
      }
    });
  }
  crearGrafico(): void {
    if (!this.chartCanvas || this.partidos.length === 0) return;

    if (this.chart) this.chart.destroy();

    const golesMap: { [idEquipo: number]: number } = {};
    
    this.partidos.forEach(partido => {
      golesMap[partido.idEquipoLocal] = (golesMap[partido.idEquipoLocal] || 0) + partido.puntosLocal;
      golesMap[partido.idEquipoVisitante] = (golesMap[partido.idEquipoVisitante] || 0) + partido.puntosVisitante;
    });

    const equiposNombres = Object.keys(golesMap).map(id => this.getNombreEquipo(+id));
    const golesDatos = Object.values(golesMap);

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: equiposNombres,
          datasets: [{
            data: golesDatos,
            backgroundColor: [
              '#097AEC', '#FF6384', '#36A2EB', '#FFCE56', 
              '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Distribución de Goles por Equipo'
            }
          }
        }
      });
    }
  }

  crearGraficoVictorias(): void {
    if (!this.chartVictoriasCanvas || this.partidos.length === 0) return;

    if (this.chartVictorias) this.chartVictorias.destroy();

    const victoriasMap: { [idEquipo: number]: number } = {};
    
    this.partidos.forEach(partido => {
      victoriasMap[partido.idEquipoLocal] = victoriasMap[partido.idEquipoLocal] || 0;
      victoriasMap[partido.idEquipoVisitante] = victoriasMap[partido.idEquipoVisitante] || 0;
      
      if (partido.puntosLocal > partido.puntosVisitante) {
        victoriasMap[partido.idEquipoLocal]++;
      } else if (partido.puntosVisitante > partido.puntosLocal) {
        victoriasMap[partido.idEquipoVisitante]++;
      }
    });

    const equiposNombres = Object.keys(victoriasMap).map(id => this.getNombreEquipo(+id));
    const victoriasDatos = Object.values(victoriasMap);

    const ctx = this.chartVictoriasCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chartVictorias = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: equiposNombres,
          datasets: [{
            label: 'Victorias',
            data: victoriasDatos,
            backgroundColor: '#28a745',
            borderColor: '#1e7e34',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Partidos Ganados por Equipo'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
  }
}