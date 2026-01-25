import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

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
}
