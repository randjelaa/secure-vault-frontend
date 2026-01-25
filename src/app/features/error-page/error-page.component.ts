import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './error-page.component.html',
  styleUrls: ['./error-page.component.css']
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
      this.path = state.path;

      switch (state.status) {
        case 403:
          this.message = "You don't have permission to access this resource.";
          break;
        case 429:
          this.message = "Too many requests. Please try again later.";
          break;
        default:
          this.message = state.message || this.message;
          break;
      }
    }
  }
}
