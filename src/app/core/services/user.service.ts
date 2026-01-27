import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';
import { DeveloperDto } from '../models/developer-dto.model';
import { UserAdminResponse } from '../models/user-admin-response.model';

interface UserResponse {
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly API = environment.apiBaseUrl;
  private readonly ADMIN = `${this.API}/admin`;
  private readonly TEAMLEAD = `${this.API}/team-lead`;
  private readonly DEVELOPER = `${this.API}/developer`;

  constructor(private http: HttpClient) {}

  getAdmin(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.ADMIN}/check`);
  }

  getTeamlead(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.TEAMLEAD}/check`);
  }

  getDeveloper(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.DEVELOPER}/check`);
  }

  uploadPublicKey(publicKey: string) {
    return this.http.post(`${this.API}/users/public-key`, { publicKey }, { withCredentials: true });
  }

  getDevelopers() {
    return this.http.get<DeveloperDto[]>(`${this.TEAMLEAD}/developers`, { withCredentials: true });
  }

  getPendingUsers() {
    return this.http.get<UserAdminResponse[]>(`${this.ADMIN}/users/pending`);
  }

  getActiveUsers() {
    return this.http.get<UserAdminResponse[]>(`${this.ADMIN}/users/active`);
  }

  approveUser(id: number) {
    return this.http.post(`${this.ADMIN}/users/${id}/approve`, {});
  }

  deleteUser(id: number) {
    return this.http.delete(`${this.ADMIN}/users/${id}`);
  }

  createUser(data: any) {
    return this.http.post(`${this.ADMIN}/users/new`, data);
  }


}
