import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Role } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="page-enter grid min-h-screen place-items-center px-4 py-10">
      <section class="grid w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl lg:grid-cols-[1fr_1.1fr]">
        <div class="bg-brand-950 px-10 py-12 text-white">
          <div class="rounded-lg bg-white p-4 shadow-xl">
            <img src="assets/brand/logo-altisoft.png" alt="Altisoft" class="mx-auto max-h-40 w-full object-contain">
          </div>
          <h1 class="mt-8 text-4xl font-extrabold leading-tight">CRM & Transacional corporativo</h1>
          <p class="mt-5 text-sm leading-6 text-blue-100">
            Operacao integrada para clientes, vendas, suporte, governanca e indicadores gerenciais.
          </p>
          <div class="mt-10 grid gap-3 text-sm text-blue-50">
            <div class="rounded-md bg-white/10 p-3">Perfis com experiencias e permissoes independentes</div>
            <div class="rounded-md bg-white/10 p-3">Dashboard executivo, CRM, vendas e suporte em uma unica SPA</div>
            <div class="rounded-md bg-white/10 p-3">Auditoria, lixeira e notificacoes em tempo real</div>
          </div>
        </div>

        <form (ngSubmit)="submit()" class="px-8 py-10 sm:px-12">
          <h2 class="text-2xl font-extrabold text-slate-950">Entrar no sistema</h2>
          <p class="mt-2 text-sm text-slate-500">Selecione um perfil de demonstracao para acessar o ambiente.</p>

          <div class="mt-5 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div class="flex items-center justify-between"><span>Admin</span><strong>admin / admin123</strong></div>
            <div class="flex items-center justify-between"><span>Vendas</span><strong>vendas / vendas123</strong></div>
            <div class="flex items-center justify-between"><span>Suporte</span><strong>suporte / suporte123</strong></div>
          </div>

          <label class="mt-6 block">
            <span class="text-sm font-bold">Perfil</span>
            <select [(ngModel)]="role" name="role" (change)="applyTestCredential()" class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3">
              <option value="ADMIN">Administrador</option>
              <option value="VENDAS">Vendas</option>
              <option value="SUPORTE">Suporte Tecnico</option>
            </select>
          </label>

          <label class="mt-4 block">
            <span class="text-sm font-bold">Usuario</span>
            <input [(ngModel)]="username" name="username" class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3" />
          </label>

          <label class="mt-4 block">
            <span class="text-sm font-bold">Senha</span>
            <input [(ngModel)]="password" name="password" type="password" class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3" />
          </label>

          <p *ngIf="error" class="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{{ error }}</p>

          <button class="mt-6 w-full btn-primary" [disabled]="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>
      </section>
    </main>
  `
})
export class LoginComponent {
  role: Role = 'ADMIN';
  username = 'admin';
  password = 'admin123';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  applyTestCredential(): void {
    const map: Record<Role, { username: string; password: string }> = {
      ADMIN: { username: 'admin', password: 'admin123' },
      VENDAS: { username: 'vendas', password: 'vendas123' },
      SUPORTE: { username: 'suporte', password: 'suporte123' }
    };
    this.username = map[this.role].username;
    this.password = map[this.role].password;
  }

  submit(): void {
    this.loading = true;
    this.error = '';
    this.auth.login(this.username, this.password, this.role).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error = 'Credenciais invalidas ou API indisponivel.';
        this.loading = false;
      }
    });
  }
}
