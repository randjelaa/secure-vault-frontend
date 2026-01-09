import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VaultStateService {
  private _dek: CryptoKey | null = null;

  set dek(key: CryptoKey | null) {
    this._dek = key;
  }

  get dek(): CryptoKey | null {
    return this._dek;
  }

  lock(): void {
    this._dek = null;
  }

  isUnlocked(): boolean {
    return !!this._dek;
  }
}
