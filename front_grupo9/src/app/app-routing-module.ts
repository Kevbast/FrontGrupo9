import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login.component/login.component';
import { HomeComponent } from './components/home.component/home.component';
import { ActivitiesComponent } from './components/activities.component/activities.component';
import { InscripcionesComponent } from './components/inscripciones.component/inscripciones.component';
import { PerfilComponent } from './components/perfil.component/perfil.component';
import { EquiposComponents } from './components/equipos.components/equipos.components';

const routes: Routes = [
  {path:"",component:HomeComponent},
  {path:"login",component:LoginComponent},
  {path: "activities/:idEvento", component: ActivitiesComponent },
  {path:"inscripciones", component: InscripcionesComponent},
  {path:"perfil",component:PerfilComponent},
  {path:"equipos/:idActividad/:idEvento", component: EquiposComponents}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }