import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VaultService } from '../../core/services/vault.service';
import { VaultSecret, VaultSecretPayload } from '../../core/models/vault-secret.model';
import { CryptoService } from '../../core/services/crypto.service';

@Component({
  standalone: true,
  selector: 'app-vault',
  imports: [CommonModule, FormsModule],
  templateUrl: './vault.component.html'
})
export class VaultComponent implements OnInit {

  secrets: VaultSecret[] = [];

  newName = '';
  newValue = '';

  decrypted: Record<number, string> = {};

  dek!: CryptoKey;
  masterPassword = '';
  unlocked = false;

  constructor(
    private vaultService: VaultService,
    private cryptoService: CryptoService
  ) {}

  async ngOnInit() {
    if (!this.cryptoService.hasVault()) return;
  }

  async unlockVault() {
    this.dek = await this.cryptoService.unlockVault(this.masterPassword);
    this.unlocked = true;
    this.loadSecrets();
  }

  loadSecrets() {
    this.vaultService.getAll().subscribe(secrets => {
      this.secrets = secrets;
    });
  }

  async createSecret() {
    const encrypted = await this.cryptoService.encryptSecret(this.dek, this.newValue);

    const payload: VaultSecretPayload = {
      name: this.newName,
      encryptedBlob: encrypted.encryptedBlob,
      iv: encrypted.iv
    };

    this.vaultService.create(payload).subscribe(() => {
      this.newName = '';
      this.newValue = '';
      this.loadSecrets();
    });
  }

  async decrypt(secret: VaultSecret) {
    this.decrypted[secret.id] = await this.cryptoService.decryptSecret(
      this.dek,
      secret.encryptedBlob,
      secret.iv
    );
  }

  async updateSecret(secret: VaultSecret) {
    const plaintext = this.decrypted[secret.id];
    if (!plaintext) return;

    const encrypted = await this.cryptoService.encryptSecret(this.dek, plaintext);

    const payload: VaultSecretPayload = {
      name: secret.name, 
      encryptedBlob: encrypted.encryptedBlob,
      iv: encrypted.iv
    };

    this.vaultService.update(secret.id, payload).subscribe(() => {
      delete this.decrypted[secret.id];
      this.loadSecrets();
    });
  }

  delete(id: number) {
    this.vaultService.delete(id).subscribe(() => {
      this.loadSecrets();
    });
  }
}
