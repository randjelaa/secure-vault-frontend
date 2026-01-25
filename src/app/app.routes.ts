import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { AdminComponent } from './features/admin/admin.component';
import { ErrorPageComponent } from './features/error-page/error-page.component';
import { authGuard } from './core/interceptors/auth.guard';
import { TeamLeadComponent } from './features/team-lead/team-lead.component';
import { DeveloperComponent } from './features/developer/developer.component';
import { LogoutComponent } from './features/logout/logout.component';
import { SelectRoleComponent } from './features/select-role/select-role.component';
import { PendingApprovalComponent } from './features/pending-approval/pending-approval.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'select-role', component: SelectRoleComponent },
  { path: 'pending-approval', component: PendingApprovalComponent },
  { path: 'logout', component: LogoutComponent },

  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'team-lead', component: TeamLeadComponent, canActivate: [authGuard] },
  { path: 'developer', component: DeveloperComponent, canActivate: [authGuard] },

  { path: 'error', component: ErrorPageComponent },
  
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'error' }
];
