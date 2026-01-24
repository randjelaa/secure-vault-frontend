import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VaultStateService } from './core/services/vault-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'secure-vault-frontend';

  constructor(private vaultState: VaultStateService) {
    window.addEventListener('beforeunload', () => {
      this.vaultState.lock();
    });
  }
}
