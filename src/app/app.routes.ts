import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { AdminComponent } from './features/admin/admin.component';
import { ErrorPageComponent } from './features/error-page/error-page.component';
import { authGuard } from './core/interceptors/auth.guard';
import { VaultComponent } from './features/vault/vault.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard]
  },
  { path: 'vault', component: VaultComponent },
  { path: 'error', component: ErrorPageComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'error' }
];
