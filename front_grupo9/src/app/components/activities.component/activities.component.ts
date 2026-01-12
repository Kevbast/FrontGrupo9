import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-activities',
  standalone: false,
  templateUrl: './activities.component.html',
  styleUrl: './activities.component.css',
})
export class ActivitiesComponent implements OnInit {
  public deportes: any[] = [];

  public videojuegos = [
    { nombre: 'FIFA 24', descripcion: 'Torneo de FIFA 24 en PlayStation 5', actual: 12, max: 16, materiales: 3 },
    { nombre: 'League of Legends', descripcion: 'Competición de LoL formato 5v5', actual: 10, max: 20, materiales: 2 }
  ];
  
  private url = environment.apiTorneo + 'api/actividades';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<any[]>(this.url).subscribe({
      next: (data) => {
        const listaVideojuegos = ['FIFA', 'LOL', 'VALORANT', 'CSGO'];
        this.deportes = data.filter(act => 
          !listaVideojuegos.some(v => act.nombre.toUpperCase().includes(v))
        );
      },
      error: (err) => console.error('Error cargando API:', err)
    });
  }
}