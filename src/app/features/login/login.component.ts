import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';
import { Router } from '@angular/router';
import { environment } from '../../../environment';
import { NgZone } from '@angular/core';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly GOOGLE_CLIENT_ID = environment.google.clientId;

  step: 'PASSWORD' | 'MFA' = 'PASSWORD';
  error: string | null = null;
  otpAuthUrl: string | null = null;
  qrCodeImage: string | null = null;

  loginForm: FormGroup;
  mfaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.mfaForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submitPassword(): void {
    if (this.loginForm.invalid) return;

    this.error = null;

    this.authService.login(this.loginForm.value).subscribe({
      next: async (res) => {
        if (res.mfaRequired) {
          this.otpAuthUrl = res.qrCodeUrl;
          await this.generateQrCode();
          this.step = 'MFA';
        }
      },
      error: () => this.error = 'Invalid username or password'
    });
  }

  submitMfa(): void {
    if (this.mfaForm.invalid) return;

    this.error = null;

    this.authService.loginMfa({
      username: this.loginForm.value.username,
      code: this.mfaForm.value.code
    }).subscribe({
      next: (res) => this.handleSuccessfulLogin(res.token),
      error: () => this.error = 'Invalid MFA code'
    });
  }

  private async generateQrCode(): Promise<void> {
    if (!this.otpAuthUrl) return;
    this.qrCodeImage = await QRCode.toDataURL(this.otpAuthUrl);
  }

  loginWithGoogle(): void {
  this.error = null;

  if (google && google.accounts && google.accounts.id) {
    google.accounts.id.cancel();
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      ux_mode: 'popup',
      use_fedcm_for_prompt: false,
      callback: (response: any) => this.handleGoogleCredential(response.credential)
    });

    google.accounts.id.prompt();
  }
}


  private handleGoogleCredential(idToken: string): void {
    this.authService.loginWithGoogle(idToken).subscribe({
      next: (res) => this.handleSuccessfulLogin(res.token),
      error: (err) => this.handleGoogleError(err, idToken)
    });
  }

  // HANDLERS
  private handleSuccessfulLogin(token: string): void {
    localStorage.setItem('accessToken', token);

    const payload = JSON.parse(atob(token.split('.')[1]));

    this.ngZone.run(() => {
      switch (payload.role) {
        case 'ADMIN':
          this.router.navigate(['/admin']);
          break;
        case 'TEAM_LEAD':
          this.router.navigate(['/team-lead']);
          break;
        case 'DEVELOPER':
          this.router.navigate(['/developer']);
          break;
        default:
          this.router.navigate(['/']);
      }
    });
  }


  private handleGoogleError(err: any, idToken: string): void {
    if (err.status === 403) {
      const message = err.error?.message;

      if (message === 'ROLE_SELECTION_REQUIRED') {
        this.router.navigate(['/select-role'], { state: { idToken } });
        return;
      }
      if (message === 'ACCOUNT_PENDING_APPROVAL') {
        this.router.navigate(['/pending-approval']);
        return;
      }

      this.error = 'Access forbidden';
    } else {
      this.error = 'Google login failed';
    }
  }
}
