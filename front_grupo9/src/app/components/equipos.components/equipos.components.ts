import { Component, OnInit } from '@angular/core';
import { Equipo } from '../../models/Equipo';
import { EquiposService } from '../../services/equiposService';
import { ActivatedRoute, Router } from '@angular/router';
import { Usuario } from '../../models/Usuario';
import { UsuariosService } from '../../services/usuariosService';
import { Curso } from '../../models/Curso';
import { Color } from '../../models/Color';

@Component({
  selector: 'app-equipos.components',
  standalone: false,
  templateUrl: './equipos.components.html',
  styleUrl: './equipos.components.css',
})
export class EquiposComponents implements OnInit {
  public equiposActividadEvento!: Array<Equipo>;
  public jugadoresEquipo: Array<Usuario> = [];
  public participantesInscritos!: Array<Usuario>;
  public listaCursosActivos!: Array<Curso>;
  public listaColores: Array<Color> = [];
  public idActividad!: number;
  public idEvento!: number;
  public equipoAbierto: number | null = null;
  public loadingJugadores: boolean = false;

  constructor(private _serviceEquipo: EquiposService, private _serviceUsuario: UsuariosService, private _route: ActivatedRoute){}

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

  esCapitan(role: string): boolean {
    if(role == "CAPITAN"){
      return true
    } else return false;
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

}
