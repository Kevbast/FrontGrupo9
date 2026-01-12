// app-routing.ts (puedes renombrarlo así)
import { Routes } from '@angular/router';
import { ActivitiesComponent } from './components/activities.component/activities.component';

export const routes: Routes = [
  { path: '', component: ActivitiesComponent },
];