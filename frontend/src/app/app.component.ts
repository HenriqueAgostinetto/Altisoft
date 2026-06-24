// Henrique Agostinetto Piva
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { NotificationService } from './core/notification.service';
import { SidebarComponent } from './layout/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <ng-container *ngIf="auth.currentUser; else publicPage">
      <app-sidebar />
      <main class="min-h-screen lg:pl-72">
        <router-outlet />
      </main>
      <div class="fixed right-4 top-4 z-50 w-80 space-y-3">
        <div *ngFor="let message of notifications.messages$ | async; let i = index" class="rounded-lg border border-red-200 bg-white p-4 text-sm font-bold text-red-800 shadow-xl">
          <div class="flex items-start justify-between gap-3">
            <span>{{ message }}</span>
            <button (click)="notifications.dismiss(i)" class="text-red-400 hover:text-red-800">x</button>
          </div>
        </div>
      </div>
    </ng-container>
    <ng-template #publicPage>
      <router-outlet />
    </ng-template>
  `
})
export class AppComponent {
  constructor(public auth: AuthService, public notifications: NotificationService) {
    if (auth.currentUser) {
      notifications.connect();
    }
    auth.user$.subscribe((user) => {
      if (user) notifications.connect();
    });
  }
}
