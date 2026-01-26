import { Component } from '@angular/core';
import { LogoutComponent } from '../logout/logout.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CryptoService } from '../../core/services/crypto.service';
import { VaultComponent } from '../vault/vault.component';
import { UserService } from '../../core/services/user.service';
import { SharedSecretResponse } from '../../core/models/shared-secret-response.model';
import { VaultService } from '../../core/services/vault.service';

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

  sharedSecrets: (SharedSecretResponse & { decrypted?: string })[] = [];

  constructor(
    private cryptoService: CryptoService,
    private userService: UserService,
    private vaultService: VaultService
  ) {}

  ngOnInit(): void {
    this.needsVaultSetup = !this.cryptoService.hasVault();
    this.loadUsername();
    this.vaultService.getSharedWithMe().subscribe(secrets => {
      this.sharedSecrets = secrets;
    });
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

  async decrypt(secret: SharedSecretResponse & { decrypted?: string }) {
    try {
      // 1. Dohvati privatni ključ korisnika
      const masterPassword = prompt('Enter your master password:');
      if (!masterPassword) return;

      const privateKey = await this.cryptoService.loadPrivateKey(masterPassword);

      // 2. Dekripcija simetričnog ključa (RSA-OAEP)
      const symmetricKeyRaw = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        this.toArrayBuffer(this.fromBase64(secret.encryptedSymmetricKey))
      );

      const symmetricKey = await crypto.subtle.importKey(
        'raw',
        symmetricKeyRaw,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // 3. Dekripcija same tajne (AES-GCM)
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: this.toArrayBuffer(this.fromBase64(secret.iv))
        },
        symmetricKey,
        this.toArrayBuffer(this.fromBase64(secret.encryptedBlob))
      );

      const plaintext = new TextDecoder().decode(decrypted);
      secret.decrypted = plaintext;
    } catch (e) {
      console.error(e);
      alert('Failed to decrypt secret');
    }
  }

  private toArrayBuffer(data: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    return buffer;
  }

  private toBase64(data: ArrayBuffer | Uint8Array): string {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  private fromBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
}

