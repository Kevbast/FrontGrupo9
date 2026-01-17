import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { provideHttpClient, HttpClientModule } from '@angular/common/http';
import { ServiceTorneo } from './services/service.torneo';
import { MenuComponent } from './components/menu.component/menu.component';
import { ActivitiesComponent } from './components/activities.component/activities.component';
import { LoginComponent } from './components/login.component/login.component';
import { HomeComponent } from './components/home.component/home.component';
import { MaterialesService } from './services/materialesService';

// ANGULAR MATERIAL
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog'; // <--- 1. AÑADIR IMPORT

import { FormsModule } from '@angular/forms';
import { EventosService } from './services/eventosService';
import { InscripcionesComponent } from './components/inscripciones.component/inscripciones.component';
import { InscripcionesService } from './services/service.inscripciones';
import { ActividadesService } from './services/service.actividad';
import { PerfilComponent } from './components/perfil.component/perfil.component';
import { CommonModule, DatePipe } from '@angular/common';
import { PrecioDialogComponent } from './components/precio-dialog/precio-dialog';

@NgModule({
  declarations: [
    App,
    MenuComponent,
    ActivitiesComponent,
    LoginComponent,
    HomeComponent,
    PerfilComponent,
    InscripcionesComponent,
    PrecioDialogComponent 
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatDialogModule, 
    FormsModule
  ],
  providers: [ServiceTorneo, EventosService, InscripcionesService, ActividadesService, DatePipe, MaterialesService],
  bootstrap: [App]
})
export class AppModule { }