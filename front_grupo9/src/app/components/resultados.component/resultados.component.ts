import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PartidoResultadoService } from '../../services/partidoResultadoService';
import { EquiposService } from '../../services/equiposService';
import { PartidoResultado } from '../../models/PartidoResultado';
import { Equipo } from '../../models/Equipo';
import { Usuario } from '../../models/Usuario';
import { ServiceTorneo } from '../../services/service.torneo';

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
  public nuevoPartido: PartidoResultado = new PartidoResultado(0, 0, 0, 0, 0, 0);
  public usuarioPerfil: Usuario | null = null;

  constructor(
    private partidoService: PartidoResultadoService,
    private equiposService: EquiposService,
    private route: ActivatedRoute,
    private serviceTorneo: ServiceTorneo
  ) {}

  ngOnInit(): void {
    // Cargar perfil del usuario desde la API
    this.serviceTorneo.getPerfil().subscribe({
      next: (usuario) => {
        this.usuarioPerfil = usuario;
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
      }
    });
    
    this.route.params.subscribe(params => {
      this.idActividad = +params['idActividad'];
      this.idEvento = +params['idEvento'];
      
      // Primero necesitamos obtener el idEventoActividad
      this.cargarDatos();
    });
  }

  cargarDatos(): void {
    this.loading = true;
    
    // Cargar todos los equipos para los selects
    this.equiposService.getTodosEquipos().subscribe({
      next: (equipos) => {
        this.equipos = equipos;
        
        // Crear mapa de equipos para acceso rápido
        this.equipos.forEach(equipo => {
          this.equiposMap[equipo.idEquipo] = equipo.nombreEquipo;
        });
        
        // Cargar equipos de la actividad específica para obtener idEventoActividad
        if (this.idActividad > 0 && this.idEvento > 0) {
          this.equiposService.getEquiposActividadEvento(this.idActividad, this.idEvento).subscribe({
            next: (equiposActividad) => {
              if (equiposActividad.length > 0 && equiposActividad[0].idEventoActividad) {
                this.idEventoActividad = equiposActividad[0].idEventoActividad;
                this.cargarPartidos();
              } else {
                this.loading = false;
              }
            },
            error: (err) => {
              console.error('Error al cargar equipos de la actividad:', err);
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar equipos:', err);
        this.loading = false;
      }
    });
  }

  cargarPartidos(): void {
    this.partidoService.getPartidosPorActividad(this.idEventoActividad).subscribe({
      next: (partidos) => {
        this.partidos = partidos;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar partidos:', err);
        this.loading = false;
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
    console.log('Abriendo modal con idEventoActividad:', eventoActividadId);
  }

  cerrarModalCrear(): void {
    this.showModalCrear = false;
  }

  crearPartido(): void {
    // Verificar permisos
    if (!this.usuarioPerfil || (this.usuarioPerfil.idRole !== 3 && this.usuarioPerfil.idRole !== 4)) {
      alert('No tienes permisos para crear partidos. Solo Organizadores y Administradores pueden hacerlo.');
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

    console.log('Enviando partido:', this.nuevoPartido);

    this.partidoService.crearPartido(this.nuevoPartido).subscribe({
      next: (response) => {
        alert('Partido creado correctamente');
        this.cerrarModalCrear();
        this.cargarPartidos();
      },
      error: (err) => {
        console.error('Error al crear partido:', err);
        alert('Error al crear el partido: ' + (err.error?.message || err.message || 'Error desconocido'));
      }
    });
  }
}
