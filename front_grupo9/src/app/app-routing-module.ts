import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login.component/login.component';
import { HomeComponent } from './components/home.component/home.component';
import { ActivitiesComponent } from './components/activities.component/activities.component';
import { PerfilComponent } from './components/perfil.component/perfil.component';
import { EquiposComponents } from './components/equipos.components/equipos.components';
import { PagosComponent } from './components/pagos.component/pagos.component';
import { ColoresComponent } from './components/colores.component/colores.component';
import { AdminComponent } from './components/admin.component/admin.component';

const routes: Routes = [
  {path:"",component:HomeComponent},
  {path:"login",component:LoginComponent},
  {path: "activities/:idEvento", component: ActivitiesComponent },
  {path:"perfil",component:PerfilComponent},
  {path:"equipos/:idActividad/:idEvento", component: EquiposComponents},
  {path:"pagos/:idEvento", component: PagosComponent},
  {path: "colores/:idActividad/:idEvento", component: ColoresComponent},
  {path:'admin', component: AdminComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }