import { Injectable } from '@angular/core';
import { SecurityPolicy } from '../models/security-policy.model';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environment';

@Injectable({ providedIn: 'root' })
export class SecurityPolicyService {

  private policy?: SecurityPolicy;
  private readonly API: string = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  loadPolicy() {
    return this.http.get<SecurityPolicy>(`${this.API}/admin/security-policy`)
      .pipe(tap(p => this.policy = p));
  }

  updatePolicy(policy: SecurityPolicy) {
    return this.http.put<SecurityPolicy>(`${this.API}/admin/security-policy`, policy)
      .pipe(tap(p => this.policy = policy));
  }
  
  getPolicy(): SecurityPolicy | undefined {
    return this.policy;
  }

  get minMasterPasswordLength(): number {
    return this.policy?.minMasterPasswordLength ?? 8;
  }

  enable() {
    return this.http.post<void>(`${this.API}/admin/honeypot/enable`, {});
  }

  disable() {
    return this.http.post<void>(`${this.API}/admin/honeypot/disable`, {});
  }

  status() {
    return this.http.get<boolean>(`${this.API}/admin/honeypot/status`);
  }
}

