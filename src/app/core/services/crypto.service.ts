import { Injectable } from '@angular/core';
import { VaultStateService } from './vault-state.service';
import { environment } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  private readonly VAULT_KEY = environment.vault.key;
  private readonly VAULT_SALT = environment.vault.salt;
  private readonly VAULT_IV = environment.vault.iv;

  constructor(private vaultState: VaultStateService) {}

  private getUserPrefix(): string {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Not authenticated');

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub; // ili payload.userId
  }

  private key(name: string): string {
    return `${this.getUserPrefix()}_${name}`;
  }

  hasVault(): boolean {
    return !!localStorage.getItem(this.key(this.VAULT_KEY));
  }

  private generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.toArrayBuffer(salt),
        iterations: 300_000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async initVault(masterPassword: string): Promise<void> {
    const salt = this.generateSalt();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const dek = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const rawDek = await crypto.subtle.exportKey('raw', dek);
    const kek = await this.deriveKey(masterPassword, salt);

    const encryptedDek = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.toArrayBuffer(iv) },
      kek,
      rawDek
    );

    localStorage.setItem(this.key(this.VAULT_KEY), this.toBase64(encryptedDek));
    localStorage.setItem(this.key(this.VAULT_SALT), this.toBase64(salt));
    localStorage.setItem(this.key(this.VAULT_IV), this.toBase64(iv));

    this.vaultState.dek = dek; // RAM
  }

  async unlockVault(masterPassword: string): Promise<CryptoKey> {
    const encryptedDek = this.fromBase64(localStorage.getItem(this.key(this.VAULT_KEY))!);
    const salt = this.fromBase64(localStorage.getItem(this.key(this.VAULT_SALT))!);
    const iv = this.fromBase64(localStorage.getItem(this.key(this.VAULT_IV))!);

    const kek = await this.deriveKey(masterPassword, salt);

    const rawDek = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.toArrayBuffer(iv) },
      kek,
      this.toArrayBuffer(encryptedDek)
    );

    const dek = await crypto.subtle.importKey(
      'raw',
      rawDek,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );

    this.vaultState.dek = dek;
    return dek;
  }

  // SECRETS
  async encryptSecret(dek: CryptoKey, plaintext: string): Promise<{ encryptedBlob: string; iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(plaintext);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.toArrayBuffer(iv) },
      dek,
      data
    );
    return { encryptedBlob: this.toBase64(encrypted), iv: this.toBase64(iv) };
  }

  async decryptSecret(dek: CryptoKey, encryptedBlob: string, iv: string): Promise<string> {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.toArrayBuffer(this.fromBase64(iv)) },
      dek,
      this.toArrayBuffer(this.fromBase64(encryptedBlob))
    );
    return new TextDecoder().decode(decrypted);
  }

  // HELPERS
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
