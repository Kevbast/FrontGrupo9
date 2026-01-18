import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-precio-dialog',
  standalone: false,
  template: `
    <div class="dialog-container">
      
      <h2 mat-dialog-title>
        <span>{{ data.precioActual !== null ? '✏️' : '💰' }}</span>
        <span>{{ data.precioActual !== null ? 'Editar Precio' : 'Asignar Precio' }}</span>
      </h2>

      <h4 class="subtitle">{{ data.nombreActividad }}</h4>
      
      <div mat-dialog-content>
        <div class="info-box">
          <mat-icon class="info-icon">info</mat-icon>
          <p>Si eliminas el precio, la actividad volverá a ser "Gratis".</p>
        </div>
        
        <div class="input-wrapper">
          <mat-form-field appearance="outline" class="full-width custom-field">
            <mat-label>Precio de la actividad</mat-label>
            <input matInput type="number" [(ngModel)]="precio" min="0" class="price-input">
            <span matSuffix class="currency-suffix">€</span>
          </mat-form-field>
        </div>
      </div>

      <div mat-dialog-actions class="actions-row">
        
        <button mat-button color="warn" 
                class="btn-delete"
                *ngIf="data.precioActual !== null" 
                (click)="eliminar()">
          <mat-icon>delete_outline</mat-icon> Borrar
        </button>

        <span class="spacer"></span>

        <button mat-button (click)="cerrar()" class="btn-cancel">Cancelar</button>
        
        <button mat-raised-button color="primary" class="btn-save" (click)="guardar()">
          GUARDAR
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* CONTENEDOR PRINCIPAL */
    .dialog-container { 
      padding: 20px 30px; 
      min-width: 380px; 
      max-width: 95vw;
      text-align: center; /* Todo centrado por defecto */
    }

    /* TÍTULO DEL DIÁLOGO */
    h2[mat-dialog-title] {
      display: flex;
      justify-content: center; /* Centrado horizontal */
      align-items: center;
      gap: 10px;
      font-size: 1.5rem;
      color: #37474f; /* Gris oscuro suave */
      margin-bottom: 5px;
    }

    /* NOMBRE DE LA ACTIVIDAD (EL PROTAGONISTA) */
    .subtitle { 
      margin: 0 0 25px 0; 
      color: #3f51b5; /* Azul Indigo elegante */
      font-size: 1.8rem; /* Grande */
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* CAJA DE INFORMACIÓN (ACOGEDORA) */
    .info-box { 
      background-color: #e3f2fd; /* Azul pastel muy suave */
      color: #1565c0; /* Texto azul oscuro */
      padding: 12px 15px;
      border-radius: 12px;
      margin-bottom: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 0.9rem;
    }
    .info-icon { font-size: 20px; height: 20px; width: 20px; }
    .info-box p { margin: 0; }

    /* INPUT */
    .full-width { width: 100%; }
    .input-wrapper { margin-bottom: 10px; }
    
    /* Hacemos el número del input más grande */
    ::ng-deep .price-input { 
      font-size: 1.5rem !important; 
      text-align: center; 
      font-weight: bold;
      color: #333;
    }
    ::ng-deep .currency-suffix {
      font-size: 1.5rem;
      font-weight: bold;
      color: #666;
    }

    /* ZONA DE BOTONES */
    .actions-row { 
      display: flex; 
      align-items: center; 
      width: 100%; 
      margin-top: 20px; 
      padding-top: 15px;
      border-top: 1px solid #f0f0f0; /* Separación sutil */
    }

    .spacer { flex: 1; }

    /* ESTILOS DE BOTONES PERSONALIZADOS */
    
    .btn-cancel {
      color: #78909c;
      font-weight: 500;
    }

    /* Botón Guardar: Degradado y Sombra */
    .btn-save {
      background: linear-gradient(135deg, #42a5f5, #1976d2); /* Azul vibrante */
      color: white;
      font-weight: bold;
      padding: 0 25px;
      border-radius: 25px; /* Redondeado */
      box-shadow: 0 4px 10px rgba(33, 150, 243, 0.3); /* Sombra suave */
      transition: transform 0.2s;
    }
    .btn-save:active { transform: scale(0.95); }

    /* Botón Borrar: Rojo suave */
    .btn-delete {
      color: #e53935;
      background-color: #ffebee; /* Fondo rojo muy pálido */
      border-radius: 20px;
      padding: 0 15px;
    }
    .btn-delete:hover {
      background-color: #ffcdd2;
    }
  `]
})
export class PrecioDialogComponent {
  public precio: number = 0;

  constructor(
    public dialogRef: MatDialogRef<PrecioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      nombreActividad: string, 
      precioActual: number | null 
    }
  ) {
    if (data.precioActual !== null) {
      this.precio = data.precioActual;
    }
  }

  cerrar(): void { this.dialogRef.close(); }
  guardar(): void { this.dialogRef.close(this.precio); }
  
  eliminar(): void {
    if(confirm('¿Seguro que quieres eliminar el precio? Pasará a ser Gratis.')) {
      this.dialogRef.close('borrar');
    }
  }
}