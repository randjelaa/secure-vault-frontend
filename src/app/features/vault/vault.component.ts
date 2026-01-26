import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VaultService } from '../../core/services/vault.service';
import { VaultSecret, VaultSecretPayload } from '../../core/models/vault-secret.model';
import { CryptoService } from '../../core/services/crypto.service';
import { UserService } from '../../core/services/user.service';

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

  developers: any[] = [];
  sharingSecretId: number | null = null;
  @Input() canShare = false;


  constructor(
    private vaultService: VaultService,
    private cryptoService: CryptoService,
    private userService: UserService
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

  openShare(secret: VaultSecret) {
    this.sharingSecretId = secret.id;

    this.userService.getDevelopers().subscribe(devs => {
      this.developers = devs;
    });
  }

  async shareWith(secret: VaultSecret, developer: any) {
    // 1. Dekripcija tajne lokalno
    const plaintext = await this.cryptoService.decryptSecret(
      this.dek,
      secret.encryptedBlob,
      secret.iv
    );

    // 2. Enkripcija za korisnika
    const encrypted = await this.cryptoService.encryptForUser(
      developer.publicKey,
      plaintext
    );

    // 3. Pošalji na backend
    this.vaultService.shareSecret({
      secretId: secret.id,             // za kasnije dohvat owner-a
      sharedWithUserId: developer.id,
      encryptedBlob: encrypted.encryptedSecret,
      iv: encrypted.iv,
      encryptedSymmetricKey: encrypted.encryptedSymmetricKey
    }).subscribe(() => {
      alert('Secret shared');
      this.sharingSecretId = null;
    });
  }

}
