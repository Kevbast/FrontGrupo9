import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common'; 

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
        console.error(err);
        this.loading = false;
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

    // Lógica de seguridad: Confirmamos con el nombre de la actividad
    if (confirm(`¿Actualizar pago de ${pago.actividad} para ${pago.curso}? \nNuevo estado: ${nuevoEstado}`)) {
      
      const nuevaCantidad = (nuevoEstado === 'PAGADO') ? pago.precioTotal : 0;

      // Aquí usamos pago.idPago, que es ÚNICO. 
      // Solo modificará ESTA fila específica, no otras del mismo curso.
      const pagoUpdate = new Pagos(
        pago.idPago, 
        pago.idCurso,
        pago.idPrecioActividad,
        nuevaCantidad,
        nuevoEstado
      );

      this._service.updatePago(pagoUpdate).subscribe({
        next: () => {
          // ACTUALIZACIÓN VISUAL
          pago.estado = nuevoEstado;
          pago.cantidadPagada = nuevaCantidad;
          this.calcularTotales();
          
          // RECOMENDACIÓN: Si tienes datos sucios (duplicados),
          // descomenta la siguiente línea para recargar la tabla completa y ver si hay duplicados
          // this.cargarPagos(); 
        },
        error: (err) => {
          console.error(err);
          alert("❌ Error al actualizar. Inténtalo de nuevo.");
          this.cargarPagos(); // Recargamos por si acaso
        }
      });
    } else {
      this.cargarPagos(); // Reset visual del select si cancela
    }
  }

  eliminarPago(idPago: number) {
  if(confirm("¿Borrar este registro de pago?")) {
     // Necesitas un endpoint DELETE /api/Pagos/{id} en tu servicio
     this._service.deletePago(idPago).subscribe(() => this.cargarPagos());
  }
  }
  
}