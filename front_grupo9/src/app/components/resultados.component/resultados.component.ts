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
    
    // Cargar equipos de la actividad específica
    if (this.idActividad > 0 && this.idEvento > 0) {
      this.equiposService.getEquiposActividadEvento(this.idActividad, this.idEvento).subscribe({
        next: (equiposActividad) => {
          // Asignar los equipos de esta actividad
          this.equipos = equiposActividad;
          
          // Crear mapa de equipos para acceso rápido
          this.equipos.forEach(equipo => {
            this.equiposMap[equipo.idEquipo] = equipo.nombreEquipo;
          });
          
          // Obtener idEventoActividad del primer equipo
          if (equiposActividad.length > 0 && equiposActividad[0].idEventoActividad) {
            this.idEventoActividad = equiposActividad[0].idEventoActividad;
            console.log('✅ Equipos cargados para esta actividad:', this.equipos.length);
            console.log('✅ idEventoActividad:', this.idEventoActividad);
            this.verificarCapitan();
            this.cargarPartidos();
          } else {
            console.warn('⚠️ No hay equipos para esta actividad');
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error al cargar equipos de la actividad:', err);
          this.loading = false;
        }
      });
    } else {
      console.error('❌ IDs inválidos - idActividad:', this.idActividad, 'idEvento:', this.idEvento);
      this.loading = false;
    }
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

  verificarCapitan(): void {
    if (!this.usuarioPerfil || !this.idEventoActividad) {
      this.esCapitan = false;
      return;
    }

    this.equiposService.getCapitanByIdEventoActividad(this.idEventoActividad).subscribe({
      next: (capitan) => {
        if (capitan && capitan.idUsuario === this.usuarioPerfil?.idUsuario) {
          this.esCapitan = true;
          console.log('✅ Usuario es capitán de esta actividad');
        } else {
          this.esCapitan = false;
          console.log('❌ Usuario NO es capitán de esta actividad');
        }
      },
      error: (err) => {
        console.error('Error al verificar capitán:', err);
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
    console.log('Abriendo modal con idEventoActividad:', eventoActividadId);
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

    console.log('📋 Datos del partido a crear:');
    console.log('  - idEventoActividad:', this.nuevoPartido.idEventoActividad);
    console.log('  - idEquipoLocal:', this.nuevoPartido.idEquipoLocal, '(' + this.getNombreEquipo(this.nuevoPartido.idEquipoLocal) + ')');
    console.log('  - idEquipoVisitante:', this.nuevoPartido.idEquipoVisitante, '(' + this.getNombreEquipo(this.nuevoPartido.idEquipoVisitante) + ')');
    console.log('  - puntosLocal:', this.nuevoPartido.puntosLocal);
    console.log('  - puntosVisitante:', this.nuevoPartido.puntosVisitante);

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

  editarPartido(partido: PartidoResultado): void {
    if (!this.esCapitan) {
      alert('No tienes permisos para editar partidos. Solo los Capitanes pueden hacerlo.');
      return;
    }

    // Copiar los datos del partido a editar
    this.partidoEditar = { ...partido };
    this.showModalEditar = true;
    console.log('Editando partido:', this.partidoEditar);
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

    console.log('📝 Actualizando partido:', this.partidoEditar);

    this.partidoService.actualizarPartido(this.partidoEditar).subscribe({
      next: (response) => {
        alert('Partido actualizado correctamente');
        this.cerrarModalEditar();
        this.cargarPartidos();
      },
      error: (err) => {
        console.error('Error al actualizar partido:', err);
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

    console.log('🗑️ Eliminando partido ID:', idPartidoResultado);

    this.partidoService.eliminarPartido(idPartidoResultado).subscribe({
      next: (response) => {
        alert('Partido eliminado correctamente');
        this.cargarPartidos();
      },
      error: (err) => {
        console.error('Error al eliminar partido:', err);
        alert('Error al eliminar el partido: ' + (err.error?.message || err.message || 'Error desconocido'));
      }
    });
  }
}
