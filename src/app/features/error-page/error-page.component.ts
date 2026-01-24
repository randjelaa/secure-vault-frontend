import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.css'
})
export class ErrorPageComponent {

  status: number | string = 'Unknown';
  message: string = 'Something went wrong';
  path?: string;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as any;

    if (state) {
      this.status = state.status ?? this.status;
      this.message = state.message ?? this.message;
      this.path = state.path;
    }
  }
}
