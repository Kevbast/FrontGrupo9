import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-precio-dialog',
  standalone: false,
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title>💰 Precio: {{ data.nombreActividad }}</h2>
      
      <div mat-dialog-content>
        <p class="info-text">Si la actividad es gratuita, déjalo en 0.</p>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Precio (€)</mat-label>
          <input matInput type="number" [(ngModel)]="precio" min="0">
          <span matSuffix>€&nbsp;</span>
        </mat-form-field>
      </div>

      <div mat-dialog-actions align="end">
        <button mat-button (click)="cerrar()">Cancelar</button>
        <button mat-raised-button color="primary" (click)="guardar()">GUARDAR</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 20px; min-width: 300px; }
    .info-text { color: #666; font-size: 0.9rem; margin-bottom: 15px; }
    .full-width { width: 100%; }
  `]
})
export class PrecioDialogComponent {
  public precio: number = 0;

  constructor(
    public dialogRef: MatDialogRef<PrecioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { nombreActividad: string }
  ) {}

  cerrar(): void { this.dialogRef.close(); }
  guardar(): void { this.dialogRef.close(this.precio); }
}