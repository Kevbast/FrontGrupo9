import { Component, OnInit } from '@angular/core';
import { ColoresService } from '../../services/coloresService';
import { Color } from '../../models/Color';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';
import { EquiposService } from '../../services/equiposService';
import { Equipo } from '../../models/Equipo';

@Component({
  selector: 'app-colores.component',
  standalone: false,
  templateUrl: './colores.component.html',
  styleUrl: './colores.component.css',
})
export class ColoresComponent implements OnInit {
  public colores!: Array<Color>;
  public nombreColorNuevo: string = '';
  public coloresElegidosEnEventoActividad!: Array<Color>;
  public idEventoActividad!: number;
  public idActividad!: number;
  public idEvento!: number;

  constructor(
    private _service: ColoresService, 
    private _router: ActivatedRoute,
    private _equiposService: EquiposService
  ){}

  ngOnInit(): void {

    this._router.params.subscribe(params => {
      this.idActividad= +params['idActividad'];
      this.idEvento= +params['idEvento'];
      
      // Obtener equipos del eventoActividad y filtrar colores elegidos
      this.obtenerColoresElegidos(this.idActividad, this.idEvento);
    })

    this._service.getAllColores().subscribe(result => {
      this.colores = result;
    })

  }

  obtenerColoresElegidos(idActividad: number, idEvento: number): void {
      if (idActividad && idEvento) {
        this._equiposService.getEquiposActividadEvento(idActividad, idEvento).subscribe(equipos => {
          // Obtener los IDs de colores únicos que están siendo usados
          const idsColoresElegidos = [...new Set(equipos.map(equipo => equipo.idColor))];
          
          // Filtrar los colores que corresponden a esos IDs
          this._service.getAllColores().subscribe(todosColores => {
            this.coloresElegidosEnEventoActividad = todosColores.filter(color => 
              idsColoresElegidos.includes(color.idColor)
            );
          });
        });
      }
  }

  createColor(): void {
    // Cerrar modal
    const modalElement = document.getElementById('modalCrearColor');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }

    this._service.createColor(this.nombreColorNuevo).subscribe(result => {
      Swal.fire({
        title: "¡Listo!",
        text: "Nuevo color añadido",
        icon: "success",
        confirmButtonText: "Cerrar"
      }).then(() => {
        window.location.reload();
      });
    });
  }

  deleteColor(idColor: number): void {
    this._service.deleteColor(idColor).subscribe(result => {
      Swal.fire({
        title: "¡Listo!",
        text: "Color seleccionado eliminado",
        icon: "success",
        confirmButtonText: "Cerrar"
      }).then(() => {
        window.location.reload();
      })
    })
  }

}
