import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rate-limit-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './rate-limit-page.component.html',
  styleUrl: './rate-limit-page.component.css'
})
export class RateLimitPageComponent {}
