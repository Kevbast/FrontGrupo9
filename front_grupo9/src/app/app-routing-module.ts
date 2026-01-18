import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login.component/login.component';
import { HomeComponent } from './components/home.component/home.component';
import { ActivitiesComponent } from './components/activities.component/activities.component';
import { InscripcionesComponent } from './components/inscripciones.component/inscripciones.component';
import { PerfilComponent } from './components/perfil.component/perfil.component';
import { PagosComponent } from './components/pagos.component/pagos.component';

const routes: Routes = [
  {path:"",component:HomeComponent},
  {path:"login",component:LoginComponent},
  {path: "activities/:idEvento", component: ActivitiesComponent },
  {path:"inscripciones", component: InscripcionesComponent},
  {path:"perfil",component:PerfilComponent},
  {path:"pagos/:idEvento", component: PagosComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }