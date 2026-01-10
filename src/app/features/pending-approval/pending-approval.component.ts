import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoutComponent } from "../logout/logout.component";

@Component({
  selector: 'app-pending-approval',
  standalone: true,
  imports: [CommonModule, LogoutComponent],
  templateUrl: './pending-approval.component.html'
})
export class PendingApprovalComponent {}
