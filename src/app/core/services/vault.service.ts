import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VaultSecret, VaultSecretPayload } from '../models/vault-secret.model';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class VaultService {

  private readonly API_BASE = `${environment.apiBaseUrl}`;
  private readonly API = `${environment.apiBaseUrl}/vault`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<VaultSecret[]> {
    return this.http.get<VaultSecret[]>(this.API);
  }

  create(payload: VaultSecretPayload): Observable<VaultSecret> {
    return this.http.post<VaultSecret>(this.API, payload);
  }

  update(id: number, payload: VaultSecretPayload): Observable<VaultSecret> {
    return this.http.put<VaultSecret>(`${this.API}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  shareSecret(payload: {
    secretId: number;
    sharedWithUserId: number;
    encryptedBlob: string;            // AES-GCM enkriptovana tajna
    iv: string;                        // IV za AES-GCM enkripciju tajne
    encryptedSymmetricKey: string;     // RSA-OAEP enkriptovani simetrični ključ
  }) {
      return this.http.post(`${this.API_BASE}/team-lead/share`, payload, { withCredentials: true });
  }

}
