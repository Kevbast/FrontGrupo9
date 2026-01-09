import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { HomeComponent } from './home.component/home.component';
import { provideHttpClient } from '@angular/common/http';
import { EventosService } from '../services/eventosService';
import { MatIconModule } from '@angular/material/icon';


// LIBRERIAS PARA OBTENER LA FECHA EN ESPAÑOL
import { LOCALE_ID } from '@angular/core';
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
import { MenuComponent } from './menu.component/menu.component';
registerLocaleData(localeEs);

@NgModule({
  declarations: [
    App,
    HomeComponent,
    MenuComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatIconModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    EventosService,
    //PROVIDER PARA OBTENER LA FECHA EN ESPAÑOL
    {provide: LOCALE_ID, useValue: 'es' }
  ],
  bootstrap: [App]
})
export class AppModule { }
