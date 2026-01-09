import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  private readonly VAULT_KEY = 'vault_encrypted_key';
  private readonly VAULT_SALT = 'vault_salt';
  private readonly VAULT_IV = 'vault_iv';

  hasVault(): boolean {
    return !!localStorage.getItem(this.VAULT_KEY);
  }

  private generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }

  // 🔐 PBKDF2 → KEK
  private async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {

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
        salt: this.toArrayBuffer(salt), // ✅ 100% TS-safe
        iterations: 300_000,
        hash: 'SHA-256'
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // 🧠 init vault
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
      {
        name: 'AES-GCM',
        iv: this.toArrayBuffer(iv) // ✅
      },
      kek,
      rawDek
    );

    localStorage.setItem(this.VAULT_KEY, this.toBase64(encryptedDek));
    localStorage.setItem(this.VAULT_SALT, this.toBase64(salt));
    localStorage.setItem(this.VAULT_IV, this.toBase64(iv));
  }

  // 🔓 unlock vault
  async unlockVault(masterPassword: string): Promise<CryptoKey> {

    const encryptedDek = this.fromBase64(
      localStorage.getItem(this.VAULT_KEY)!
    );

    const salt = this.fromBase64(
      localStorage.getItem(this.VAULT_SALT)!
    );

    const iv = this.fromBase64(
      localStorage.getItem(this.VAULT_IV)!
    );

    const kek = await this.deriveKey(masterPassword, salt);

    const rawDek = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this.toArrayBuffer(iv) // ✅
      },
      kek,
      this.toArrayBuffer(encryptedDek) // ✅
    );

    return crypto.subtle.importKey(
      'raw',
      rawDek,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );
  }

  // ======================
  // SECRET ENCRYPT / DECRYPT
  // ======================

  async encryptSecret(
    dek: CryptoKey,
    plaintext: string
  ): Promise<{ encryptedBlob: string; iv: string }> {

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode(plaintext);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: this.toArrayBuffer(iv) },
      dek,
      data
    );

    return {
      encryptedBlob: this.toBase64(encrypted),
      iv: this.toBase64(iv)
    };
  }

  async decryptSecret(
    dek: CryptoKey,
    encryptedBlob: string,
    iv: string
  ): Promise<string> {

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this.toArrayBuffer(this.fromBase64(iv))
      },
      dek,
      this.toArrayBuffer(this.fromBase64(encryptedBlob))
    );

    return new TextDecoder().decode(decrypted);
  }


  // ======================
  // helpers
  // ======================

  private toArrayBuffer(data: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    return buffer;
  }


  private toBase64(data: ArrayBuffer | Uint8Array): string {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private fromBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
