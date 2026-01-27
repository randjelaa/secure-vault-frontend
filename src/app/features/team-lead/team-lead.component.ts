import { Component, OnInit } from '@angular/core';
import { CryptoService } from '../../core/services/crypto.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogoutComponent } from "../logout/logout.component";
import { VaultComponent } from '../vault/vault.component';
import { UserService } from '../../core/services/user.service';
import { SecurityPolicyService } from '../../core/services/security-policy.service';

@Component({
  selector: 'app-team-lead',
  standalone: true,
  imports: [FormsModule, RouterModule, LogoutComponent, VaultComponent],
  templateUrl: './team-lead.component.html',
  styleUrl: './team-lead.component.css'
})
export class TeamLeadComponent implements OnInit {

  needsVaultSetup = false;
  masterPassword = '';
  username: string | null = null;

  constructor(
    private cryptoService: CryptoService,
    private userService: UserService,
    private securityPolicyService: SecurityPolicyService
  ) {}

  ngOnInit(): void {
    this.needsVaultSetup = !this.cryptoService.hasVault();
    this.loadUsername();
  }

  async createVault(): Promise<void> {
    const minLen = this.securityPolicyService.minMasterPasswordLength;

    if (!this.masterPassword || this.masterPassword.length < minLen) {
      alert(`Master password must be at least ${minLen} characters long`);
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
    this.userService.getTeamlead().subscribe({
      next: res => this.username = res.username,
      error: err => {
        console.error('Failed to load username', err);
        this.username = null;
      }
    });
  }
}

