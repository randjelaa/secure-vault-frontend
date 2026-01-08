import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';
import { Router } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly GOOGLE_CLIENT_ID ='448986711630-6i1hul9kt6l3a2quiesl0n5bui6mej13.apps.googleusercontent.com';

  step: 'PASSWORD' | 'MFA' = 'PASSWORD';

  loginForm: FormGroup;
  mfaForm: FormGroup;

  /** OTP URI koji dolazi sa backend-a (otpauth://...) */
  otpAuthUrl: string | null = null;

  /** Prava slika (base64) za <img> */
  qrCodeImage: string | null = null;

  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
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
      error: () => {
        this.error = 'Invalid username or password';
      }
    });
  }

  submitMfa(): void {
    if (this.mfaForm.invalid) return;

    this.error = null;

    this.authService.loginMfa({
        username: this.loginForm.value.username,
        code: this.mfaForm.value.code
      }).subscribe({
        next: (res) => {
          localStorage.setItem('accessToken', res.token);

          // primjer: redirect prema ulozi admin
          const payload = JSON.parse(atob(res.token.split('.')[1]));
          if (payload.role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']); // fallback
          }
        },
        error: () => {
          this.error = 'Invalid MFA code';
        }
      });
  }

  private async generateQrCode(): Promise<void> {
    if (!this.otpAuthUrl) return;

    this.qrCodeImage = await QRCode.toDataURL(this.otpAuthUrl);
  }

  loginWithGoogle(): void {
    this.error = null;

    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response: any) => {
        this.handleGoogleCredential(response.credential);
      }
    });

    google.accounts.id.prompt(); 
  }

  private handleGoogleCredential(idToken: string): void {
    this.authService.loginWithGoogle(idToken).subscribe({
      next: (res) => {
        localStorage.setItem('accessToken', res.token);

        const payload = JSON.parse(atob(res.token.split('.')[1]));

        if (payload.role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        if (err.status === 403) {
          this.error = 'Account pending admin approval';
        } else {
          this.error = 'Google login failed';
        }
      }
    });
  }
}
