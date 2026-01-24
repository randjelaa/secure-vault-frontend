import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { VaultStateService } from './vault-state.service';
import { AuthRequest } from '../models/auth-request.model';
import { LoginStepResponse } from '../models/login-step-response.model';
import { MfaVerifyRequest } from '../models/mfa-verify-request.model';
import { AuthResponse } from '../models/auth-response.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API = 'http://localhost:8080/auth';

  constructor(private http: HttpClient, private vaultState: VaultStateService, private router: Router) {}

  login(request: AuthRequest): Observable<LoginStepResponse> {
    return this.http.post<LoginStepResponse>(`${this.API}/login`, request);
  }

  loginMfa(request: MfaVerifyRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login/mfa`, request, { withCredentials: true });
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/refresh`, {}, { withCredentials: true });
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.API}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        localStorage.removeItem('accessToken');
        this.vaultState.lock(); 
        this.router.navigateByUrl('/login', { replaceUrl: true }).then(() => {
          window.location.reload(); //todo: testing
        });
      })
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API}/login/oidc`,
      { provider: 'GOOGLE', idToken },
      { withCredentials: true }
    );
  }
}
