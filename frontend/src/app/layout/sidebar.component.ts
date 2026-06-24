// Henrique Agostinetto Piva
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="fixed inset-y-0 left-0 hidden w-72 flex-col bg-brand-950 text-white lg:flex">
      <div class="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div class="grid h-12 w-12 place-items-center rounded-md bg-white p-1 shadow-sm">
          <img src="assets/brand/logo-altisoft-mark.png" alt="Altisoft" class="h-full w-full object-contain">
        </div>
        <div>
          <p class="font-extrabold">Altisoft</p>
          <p class="text-xs text-blue-100">CRM & Transacional</p>
        </div>
      </div>

      <nav class="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        <a routerLink="/dashboard" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Dashboard</a>

        <p *ngIf="auth.hasRole('ADMIN','VENDAS')" class="px-4 pt-4 text-xs font-extrabold uppercase tracking-widest text-blue-200">Comercial</p>
        <a *ngIf="auth.hasRole('ADMIN','VENDAS')" routerLink="/crm" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">CRM Clientes</a>
        <a *ngIf="auth.hasRole('ADMIN','VENDAS')" routerLink="/pipeline" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Pipeline</a>
        <a *ngIf="auth.hasRole('ADMIN','VENDAS')" routerLink="/propostas" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Propostas</a>
        <a *ngIf="auth.hasRole('ADMIN','VENDAS')" routerLink="/agenda" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Agenda</a>
        <a *ngIf="auth.hasRole('ADMIN','VENDAS')" routerLink="/contratos" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Contratos</a>
        <a *ngIf="auth.hasRole('ADMIN','VENDAS')" routerLink="/vendas" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Transações</a>

        <p *ngIf="auth.hasRole('ADMIN','SUPORTE')" class="px-4 pt-4 text-xs font-extrabold uppercase tracking-widest text-blue-200">Suporte</p>
        <a *ngIf="auth.hasRole('ADMIN','SUPORTE')" routerLink="/suporte" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Chamados</a>
        <a *ngIf="auth.hasRole('ADMIN','SUPORTE')" routerLink="/sla" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">SLA</a>
        <a *ngIf="auth.hasRole('ADMIN','SUPORTE')" routerLink="/inventario" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Inventário</a>
        <a *ngIf="auth.hasRole('ADMIN','SUPORTE')" routerLink="/base-conhecimento" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Base Técnica</a>

        <a *ngIf="auth.hasRole('ADMIN')" routerLink="/admin" routerLinkActive="bg-white/10" class="block rounded-md px-4 py-3 text-sm font-bold hover:bg-white/10">Governança</a>
      </nav>

      <footer class="border-t border-white/10 p-5 text-sm">
        <p class="font-bold">Henrique A. Piva</p>
        <p class="text-blue-100">3º Semestre</p>
        <p class="mt-3 rounded-md bg-white/10 px-3 py-2 text-xs">Cargo: {{ auth.currentUser?.role }}</p>
        <button (click)="logout()" class="mt-4 w-full rounded-md bg-white px-4 py-2 font-bold text-brand-950">Sair</button>
      </footer>
    </aside>
  `
})
export class SidebarComponent {
  constructor(public auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
