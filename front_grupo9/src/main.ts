import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app'; // Asegúrate de que la ruta sea correcta
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app-routing-module'; // Si tienes rutas definidas

bootstrapApplication(App, {
  providers: [
    provideHttpClient(), // ✅ Obligatorio para leer el Swagger
    provideRouter(routes) // ✅ Configura tus rutas aquí en lugar de AppRoutingModule
  ]
}).catch(err => console.error(err));