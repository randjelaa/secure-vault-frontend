import { Component, OnInit } from '@angular/core';
import { CryptoService } from '../../core/services/crypto.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogoutComponent } from '../logout/logout.component';
import { VaultComponent } from '../vault/vault.component';
import { UserService } from '../../core/services/user.service';
import { UserAdminResponse } from '../../core/models/user-admin-response.model';
import { SecurityPolicyService } from '../../core/services/security-policy.service';
import { SecurityPolicy } from '../../core/models/security-policy.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, RouterModule, LogoutComponent, VaultComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  needsVaultSetup = false;
  masterPassword = '';
  username: string | null = null;

  pendingUsers: UserAdminResponse[] = [];
  activeUsers: UserAdminResponse[] = [];

  newUser = {
    username: '',
    email: '',
    password: '',
    role: 'DEVELOPER'
  };

  policy?: SecurityPolicy;
  policyDraft?: SecurityPolicy;
  policySaved = false;

  constructor(
    private cryptoService: CryptoService,
    private userService: UserService,
    private securityPolicyService: SecurityPolicyService
  ) {}

  ngOnInit(): void {
    this.needsVaultSetup = !this.cryptoService.hasVault();
    this.loadUsername();
    this.loadUsers();

    this.securityPolicyService.loadPolicy().subscribe(p => {
      this.policy = p;
      this.policyDraft = { ...p }; 
    });
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
    this.userService.getAdmin().subscribe({
      next: res => this.username = res.username,
      error: err => {
        console.error('Failed to load username', err);
        this.username = null;
      }
    });
  }

  loadUsers(): void {
    this.userService.getPendingUsers().subscribe(res => {
      this.pendingUsers = res;
    });

    this.userService.getActiveUsers().subscribe(res => {
      this.activeUsers = res;
    });
  }

  approveUser(id: number): void {
    this.userService.approveUser(id).subscribe(() => {
      this.loadUsers();
    });
  }

  deleteUser(id: number): void {
    if (!confirm('Are you sure?')) return;

    this.userService.deleteUser(id).subscribe(() => {
      this.loadUsers();
    });
  }

  createUser(): void {
    this.userService.createUser(this.newUser).subscribe(() => {
      this.newUser = {
        username: '',
        email: '',
        password: '',
        role: 'DEVELOPER'
      };
      this.loadUsers();
    });
  }

  savePolicy(): void {
  if (!this.policyDraft) return;

  this.securityPolicyService.updatePolicy(this.policyDraft)
    .subscribe(updated => {
      this.policy = updated;
      this.policyDraft = { ...updated };
      this.policySaved = true;

      setTimeout(() => this.policySaved = false, 3000);
    });
}

}
