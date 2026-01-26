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

  private readonly ASYM_PRIVATE_KEY = environment.vault.private_key;
  private readonly ASYM_PUBLIC_KEY = environment.vault.public_key;

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
    await this.generateAsymmetricKeys(masterPassword); //ASYM
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

  //ASYM
  private async generateAsymmetricKeys(masterPassword: string): Promise<void> {
    // 1. Generiši RSA ključ par
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    // 2. Exportuj ključeve
    const publicKeyRaw = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    // 3. Deriviraj novi KEK iz master password (za privatni ključ)
    const salt = crypto.getRandomValues(new Uint8Array(16)); // novi salt
    const kek = await this.deriveKey(masterPassword, salt);

    // 4. Enkripcija privatnog ključa
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedPrivate = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      kek,
      privateKeyRaw
    );

    // 5. Spremi u localStorage
    localStorage.setItem(this.key(this.ASYM_PUBLIC_KEY), this.toBase64(publicKeyRaw));
    localStorage.setItem(
      this.key(this.ASYM_PRIVATE_KEY),
      JSON.stringify({
        blob: this.toBase64(encryptedPrivate),
        iv: this.toBase64(iv),
        salt: this.toBase64(salt)
      })
    );
  }

  async loadPrivateKey(masterPassword: string): Promise<CryptoKey> {
    // Učitaj enkriptovani privatni ključ iz localStorage
    const encryptedJson = localStorage.getItem(this.key(this.ASYM_PRIVATE_KEY));
    if (!encryptedJson) {
      throw new Error('Encrypted private key not found in localStorage');
    }

    const encrypted = JSON.parse(encryptedJson);

    if (!encrypted.blob || !encrypted.iv || !encrypted.salt) {
      throw new Error('Encrypted private key is missing required fields (blob, iv, salt)');
    }

    // Dohvati salt iz samog JSON-a
    const salt = this.fromBase64(encrypted.salt);

    // Kreiraj KEK iz master password-a i salt-a
    const kek = await this.deriveKey(masterPassword, salt);

    // Dekripcija privatnog ključa (AES-GCM)
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this.toArrayBuffer(this.fromBase64(encrypted.iv))
      },
      kek,
      this.toArrayBuffer(this.fromBase64(encrypted.blob))
    );

    // Importuj privatni ključ (RSA-OAEP) za dekripciju simetričnih ključeva
    return crypto.subtle.importKey(
      'pkcs8',
      decrypted,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );
  }

  async encryptForUser(publicKeyBase64: string, plaintext: string): Promise<{
    encryptedSecret: string;
    iv: string;
    encryptedSymmetricKey: string;
  }> {
    // 1. Kreiraj simetrični ključ
    const symmetricKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // 2. Enkripcija same tajne
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const encryptedSecret = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      symmetricKey,
      encoded
    );

    // 3. Importuj javni ključ developera
    const publicKey = await crypto.subtle.importKey(
      'spki',
      this.toArrayBuffer(this.fromBase64(publicKeyBase64)),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );

    // 4. Export simetričnog ključa i enkripcija RSA-OAEP
    const symmetricKeyRaw = await crypto.subtle.exportKey('raw', symmetricKey);
    const encryptedSymmetricKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      symmetricKeyRaw
    );

    return {
      encryptedSecret: this.toBase64(encryptedSecret),
      iv: this.toBase64(iv),
      encryptedSymmetricKey: this.toBase64(encryptedSymmetricKey)
    };
  }

  getPublicKeyBase64(): string {
    const key = localStorage.getItem(this.key(this.ASYM_PUBLIC_KEY));
    if (!key) {
      throw new Error('Public key not found in localStorage');
    }
    return key;
  }

}
