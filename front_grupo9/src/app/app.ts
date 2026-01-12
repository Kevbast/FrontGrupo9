import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ActivitiesComponent } from './components/activities.component/activities.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ActivitiesComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App { }