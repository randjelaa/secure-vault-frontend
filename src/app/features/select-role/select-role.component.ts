import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SelectRoleRequest } from '../../core/models/select-role-request.model';

@Component({
  selector: 'app-select-role',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-role.component.html'
})
export class SelectRoleComponent {
  private readonly url: string = 'http://localhost:8080/auth/complete-oidc';

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
      this.router.navigate(['/login']);
    }
  }

  selectRole(role: 'TEAM_LEAD' | 'DEVELOPER'): void {
    if (!this.idToken) return;

    this.loading = true;
    this.error = null;

    const payload: SelectRoleRequest = {
      role,
      idToken: this.idToken
    };

    this.http.post(this.url, payload).subscribe({
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
