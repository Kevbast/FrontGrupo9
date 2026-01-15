import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, HttpClientModule } from '@angular/common/http';
import { ServiceTorneo } from './services/service.torneo';
import { MenuComponent } from './components/menu.component/menu.component';
import { ActivitiesComponent } from './components/activities.component/activities.component';
import { LoginComponent } from './components/login.component/login.component';
import { HomeComponent } from './components/home.component/home.component';
//ANGULAR MATERIAL
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { EventosService } from './services/eventosService';
import { InscripcionesComponent } from './components/inscripciones.component/inscripciones.component';
import { InscripcionesService } from './services/service.inscripciones';
import { ActividadesService } from './services/service.actividad';

@NgModule({
  declarations: [
    App,
    MenuComponent,
    ActivitiesComponent,
    LoginComponent,
    HomeComponent,
    InscripcionesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule
  ],
  providers: [ServiceTorneo, EventosService, InscripcionesService, ActividadesService],
  bootstrap: [App]
})
export class AppModule { }