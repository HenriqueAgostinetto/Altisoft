import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <h1 class="text-2xl font-extrabold text-slate-950">Contratos e Renovacoes</h1>
      <p class="text-sm text-slate-500">Controle de MRR estimado, vencimentos e oportunidades de renovação.</p>

      <div class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
            <tr><th class="px-4 py-3">Cliente</th><th class="px-4 py-3">Plano</th><th class="px-4 py-3">MRR</th><th class="px-4 py-3">Renovacao</th><th class="px-4 py-3">Risco</th></tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let cliente of clientes">
              <td class="px-4 py-3 font-semibold">{{ cliente.nome }}</td>
              <td class="px-4 py-3">{{ cliente.sistema_comprado || 'Altisoft Suite' }}</td>
              <td class="px-4 py-3 font-bold text-emerald-700">{{ mrr(cliente) | currency:'BRL' }}</td>
              <td class="px-4 py-3">{{ renovacao(cliente.id) }}</td>
              <td class="px-4 py-3"><span class="rounded-md px-2 py-1 text-xs font-bold" [ngClass]="riscoClass(cliente)">{{ risco(cliente) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class ContratosComponent implements OnInit {
  clientes: Cliente[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getClientes().subscribe((clientes) => this.clientes = clientes);
  }

  mrr(cliente: Cliente): number {
    return 690 + Number(cliente.maquinas_instaladas || 1) * 89;
  }

  renovacao(id: number): string {
    const month = ((id * 2) % 12) + 1;
    return `2026-${String(month).padStart(2, '0')}-15`;
  }

  risco(cliente: Cliente): string {
    return cliente.prioridade_score < 35 || cliente.status_cliente === 'INATIVO' ? 'Alto' : cliente.prioridade_score < 65 ? 'Medio' : 'Baixo';
  }

  riscoClass(cliente: Cliente): string {
    const risco = this.risco(cliente);
    return risco === 'Alto' ? 'bg-red-50 text-red-700' : risco === 'Medio' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';
  }
}
