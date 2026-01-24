import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { AdminComponent } from './features/admin/admin.component';
import { ErrorPageComponent } from './features/error-page/error-page.component';
import { authGuard } from './core/interceptors/auth.guard';
import { VaultComponent } from './features/vault/vault.component';
import { TeamLeadComponent } from './features/team-lead/team-lead.component';
import { DeveloperComponent } from './features/developer/developer.component';
import { LogoutComponent } from './features/logout/logout.component';
import { SelectRoleComponent } from './features/select-role/select-role.component';
import { PendingApprovalComponent } from './features/pending-approval/pending-approval.component';
import { RateLimitPageComponent } from './features/rate-limit-page/rate-limit-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard]
  },
  {
    path: 'team-lead',
    component: TeamLeadComponent,
    canActivate: [authGuard]
  },
  {
    path: 'developer',
    component: DeveloperComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'vault', 
    component: VaultComponent,
    canActivate: [authGuard] 
  },
  {
    path: 'select-role',
    component: SelectRoleComponent
  },
  {
    path: 'pending-approval',
    component: PendingApprovalComponent
  },
  { path: 'logout', component: LogoutComponent },
  { path: 'error', component: ErrorPageComponent },
  { path: 'rate-limit-page', component: RateLimitPageComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'error' }
];
