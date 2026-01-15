import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login.component/login.component';
import { HomeComponent } from './components/home.component/home.component';
import { ActivitiesComponent } from './components/activities.component/activities.component';
import { InscripcionesComponent } from './components/inscripciones.component/inscripciones.component';

const routes: Routes = [
  {path:"",component:HomeComponent},
  {path:"login",component:LoginComponent},
  {path:"activities",component: ActivitiesComponent},
  {path:"inscripciones", component: InscripcionesComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }