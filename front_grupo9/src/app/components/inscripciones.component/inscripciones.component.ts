import { Component, OnInit } from '@angular/core';
import { InscripcionesService } from '../../services/service.inscripciones';
import { Inscripcion } from '../../../models/Inscripcion';

@Component({
  selector: 'app-inscripciones',
  standalone: false,
  templateUrl: './inscripciones.component.html',
  styleUrls: ['./inscripciones.component.css']
})
export class InscripcionesComponent implements OnInit {
  // Inicializamos el modelo basado en tu clase Inscripcion
  public inscripcion: Inscripcion = new Inscripcion(0, 0, 0, false, new Date().toISOString());
  public isLoading: boolean = false;
  public errorMessage: string = "";

  constructor(private _service: InscripcionesService) {}

  ngOnInit(): void {
    // Lógica inicial vacía para visualización
  }

  // Función para el botón del formulario
  enviarInscripcion(): void {
    console.log('Datos capturados en el formulario:', this.inscripcion);
    // Aquí se llamará a crearInscripcion del servicio más adelante
  }
}