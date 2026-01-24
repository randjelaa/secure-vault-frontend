import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VaultSecret, VaultSecretPayload } from '../models/vault-secret.model';

@Injectable({ providedIn: 'root' })
export class VaultService {

  private readonly API = 'http://localhost:8080/vault';

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
}
