import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthRequest } from '../models/auth-request.model';
import { LoginStepResponse } from '../models/login-step-response.model';
import { MfaVerifyRequest } from '../models/mfa-verify-request.model';
import { AuthResponse } from '../models/auth-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) {}

  login(request: AuthRequest): Observable<LoginStepResponse> {
    return this.http.post<LoginStepResponse>(
      `${this.API}/login`,
      request
    );
  }

  loginMfa(request: MfaVerifyRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API}/login/mfa`,
      request,
      { withCredentials: true } // ⬅️ BITNO zbog refresh cookie-ja
    );
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API}/refresh`,
      {},
      { withCredentials: true }
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.API}/logout`,
      {},
      { withCredentials: true }
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.API}/login/oidc`,
      {
        provider: 'GOOGLE',
        idToken
      },
      { withCredentials: true }
    );
  }
}
