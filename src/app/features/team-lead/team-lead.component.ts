import { Component, OnInit } from '@angular/core';
import { CryptoService } from '../../core/services/crypto.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogoutComponent } from "../logout/logout.component";
import { VaultComponent } from '../vault/vault.component';
import { UserService } from '../../core/services/user.service';

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

