import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import Swal from 'sweetalert2';

// Importamos tus Modelos
import { Pagos } from '../../models/Pagos';
import { PagosCompletos } from '../../models/PagosCompletos';
import { ActividadesService } from '../../services/service.actividad';

@Component({
  selector: 'app-pagos',
  standalone: false,
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {

  public idEvento!: number;
  public listaPagos: PagosCompletos[] = []; 
  public loading: boolean = true;

  // Estadísticas
  public totalEsperado: number = 0;
  public totalRecaudado: number = 0;
  public deudaTotal: number = 0;

  public displayedColumns: string[] = ['curso', 'actividad', 'precio', 'pagado', 'estado']; // Quitamos 'acciones' si ya no usas botones extra

  constructor(
    private _service: ActividadesService,
    private route: ActivatedRoute,
    private _location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idEvento = +params['idEvento'];
      this.cargarPagos();
    });
  }

  cargarPagos() {
    this.loading = true;
    this._service.getPagosEvento(this.idEvento).subscribe({
      next: (data) => {
        this.listaPagos = data;
        console.log('📊 Pagos cargados:', data);
        
        // Log para depurar estados
        data.forEach((p, i) => {
          console.log(`Pago ${i}: estado="${p.estado}" (longitud: ${p.estado?.length})`);
        });
        
        this.calcularTotales();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar pagos:', err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar datos',
          text: 'No se pudieron cargar los pagos del evento. Por favor, recarga la página.',
          confirmButtonColor: '#d33'
        });
      }
    });
  }

  calcularTotales() {
    this.totalEsperado = 0;
    this.totalRecaudado = 0;
    
    this.listaPagos.forEach(p => {
      this.totalEsperado += p.precioTotal;
      this.totalRecaudado += p.cantidadPagada;
    });
    this.deudaTotal = this.totalEsperado - this.totalRecaudado;
  }

  volver() {
    this._location.back();
  }

  // --- NUEVA FUNCIÓN PARA EL SELECT ---
  // Sustituye a 'cobrar'
  cambiarEstado(pago: PagosCompletos, nuevoEstado: string) {
    
    if (pago.estado === nuevoEstado) return;

    // Determinar el icono y color según el estado
    let iconType: 'question' | 'warning' | 'success' = 'question';
    let confirmButtonColor = '#3085d6';
    let mensajeEstado = '';

    if (nuevoEstado === 'PAGADO') {
      iconType = 'success';
      confirmButtonColor = '#2e7d32';
      mensajeEstado = 'marcar como PAGADO';
    } else if (nuevoEstado === 'PENDIENTE') {
      iconType = 'warning';
      confirmButtonColor = '#f39c12';
      mensajeEstado = 'marcar como EXENTO';
    } else {
      iconType = 'warning';
      confirmButtonColor = '#d33';
      mensajeEstado = 'marcar como SIN PAGAR';
    }

    Swal.fire({
      title: '¿Confirmar cambio de estado?',
      html: `<strong>${pago.actividad}</strong><br>Curso: ${pago.curso}<br><br>¿Deseas ${mensajeEstado}?`,
      icon: iconType,
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        const nuevaCantidad = (nuevoEstado === 'PAGADO') ? pago.precioTotal : 0;

        const pagoUpdate = new Pagos(
          pago.idPago, 
          pago.idCurso,
          pago.idPrecioActividad,
          nuevaCantidad,
          nuevoEstado
        );

        // Mostrar loading
        Swal.fire({
          title: 'Actualizando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this._service.updatePago(pagoUpdate).subscribe({
          next: () => {
            pago.estado = nuevoEstado;
            pago.cantidadPagada = nuevaCantidad;
            this.calcularTotales();
            
            Swal.fire({
              icon: 'success',
              title: '¡Estado actualizado!',
              text: `El pago se marcó como: ${nuevoEstado}`,
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error('Error al actualizar pago:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar el estado. Intenta nuevamente.',
              confirmButtonColor: '#d33'
            });
            this.cargarPagos();
          }
        });
      } else {
        // Usuario canceló, recargar para resetear el select visual
        this.cargarPagos();
      }
    });
  }

  eliminarPago(idPago: number, actividad: string, curso: string) {
    Swal.fire({
      title: '¿Eliminar registro de pago?',
      html: `<strong>Actividad:</strong> ${actividad}<br><strong>Curso:</strong> ${curso}<br><br><span style="color: #d33;">⚠️ Esta acción no se puede deshacer.</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Mostrar loading
        Swal.fire({
          title: 'Eliminando...',
          text: 'Por favor espera',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this._service.deletePago(idPago).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: '¡Eliminado!',
              text: 'El registro de pago se eliminó correctamente.',
              timer: 2000,
              showConfirmButton: false
            });
            this.cargarPagos();
          },
          error: (err) => {
            console.error('Error al eliminar pago:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el registro. Intenta nuevamente.',
              confirmButtonColor: '#d33'
            });
          }
        });
      }
    });
  }
  
}