import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-select-role',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-role.component.html'
})
export class SelectRoleComponent {

  loading = false;
  error: string | null = null;

  private idToken: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const nav = this.router.getCurrentNavigation();
    this.idToken = nav?.extras.state?.['idToken'] ?? null;

    if (!this.idToken) {
      // direktan access / refresh
      this.router.navigate(['/login']);
    }
  }

  selectRole(role: 'TEAM_LEAD' | 'DEVELOPER'): void {
    if (!this.idToken) return;

    this.loading = true;
    this.error = null;

    this.http.post(
      'http://localhost:8080/auth/complete-oidc',
      {
        role,
        idToken: this.idToken
      }
    ).subscribe({
      next: () => {
        this.router.navigate(['/pending-approval']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to save role';
      }
    });
  }
}
