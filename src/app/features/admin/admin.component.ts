import { Component, OnInit } from '@angular/core';
import { CryptoService } from '../../core/services/crypto.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

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
