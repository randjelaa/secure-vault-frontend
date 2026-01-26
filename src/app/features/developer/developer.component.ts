import { Component } from '@angular/core';
import { LogoutComponent } from '../logout/logout.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CryptoService } from '../../core/services/crypto.service';
import { VaultComponent } from '../vault/vault.component';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-developer',
  standalone: true,
  imports: [FormsModule, RouterModule, LogoutComponent, VaultComponent],
  templateUrl: './developer.component.html',
  styleUrl: './developer.component.css'
})
export class DeveloperComponent {

  needsVaultSetup = false;
  masterPassword = '';
  username: string | null = null;

  constructor(
    private cryptoService: CryptoService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.needsVaultSetup = !this.cryptoService.hasVault();
    this.loadUsername();
  }

  async createVault(): Promise<void> {
    if (!this.masterPassword || this.masterPassword.length < 8) {
      alert('Master password too short');
      return;
    }

    await this.cryptoService.initVault(this.masterPassword);
    this.masterPassword = '';
    
    const publicKey = this.cryptoService.getPublicKeyBase64();

    this.userService.uploadPublicKey(publicKey).subscribe({
      next: () => {
        console.log('Public key saved');
      }
    });
    
    this.needsVaultSetup = false;
    alert('Vault initialized');
  }

  private loadUsername(): void {
    this.userService.getDeveloper().subscribe({
      next: res => this.username = res.username,
      error: err => {
        console.error('Failed to load username', err);
        this.username = null;
      }
    });
  }
}

