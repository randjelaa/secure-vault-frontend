import { Component } from '@angular/core';
import { LogoutComponent } from '../logout/logout.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CryptoService } from '../../core/services/crypto.service';
import { VaultComponent } from '../vault/vault.component';

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
  
    constructor(private cryptoService: CryptoService) {}
  
    ngOnInit(): void {
      this.needsVaultSetup = !this.cryptoService.hasVault();
    }
  
    async createVault(): Promise<void> {
      if (!this.masterPassword || this.masterPassword.length < 8) {
        alert('Master password too short');
        return;
      }
  
      await this.cryptoService.initVault(this.masterPassword);
      this.masterPassword = '';
      this.needsVaultSetup = false;
  
      alert('Vault initialized');
    }
}
