import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LoginComponent } from './components/login.component/login.component';
import { HomeComponent } from './components/home.component/home.component';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { ServiceTorneo } from './services/service.torneo';
import { MenuComponent } from './components/menu.component/menu.component';
//ANGULAR MATERIAL
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon'; // Opcional, para iconos

@NgModule({
  declarations: [
    App,
    LoginComponent,
    HomeComponent,
    MenuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    // 2. AÑADIRLOS AL ARRAY DE IMPORTS AQUÍ
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),provideHttpClient(),ServiceTorneo
  ],
  bootstrap: [App]
})
export class AppModule { }
