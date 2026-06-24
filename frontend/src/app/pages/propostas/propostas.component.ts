// Henrique Agostinetto Piva
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Cliente } from '../../core/models';

@Component({
  selector: 'app-propostas',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <section class="page-enter px-4 py-6 sm:px-8">
      <h1 class="text-2xl font-extrabold text-slate-950">Propostas Comerciais</h1>
      <p class="text-sm text-slate-500">Simulador de ofertas e valores para negociações B2B.</p>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article *ngFor="let cliente of clientes" class="card hover:-translate-y-1 hover:shadow-lg">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="font-extrabold">{{ cliente.nome }}</h2>
              <p class="text-sm text-slate-500">{{ cliente.sistema_comprado || 'Altisoft Suite' }}</p>
            </div>
            <span class="rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{{ cliente.status_cliente }}</span>
          </div>
          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-md bg-slate-50 p-3"><dt class="text-slate-500">Licencas</dt><dd class="font-bold">{{ cliente.maquinas_instaladas || 1 }}</dd></div>
            <div class="rounded-md bg-slate-50 p-3"><dt class="text-slate-500">Score</dt><dd class="font-bold">{{ cliente.prioridade_score }}</dd></div>
            <div class="rounded-md bg-slate-50 p-3"><dt class="text-slate-500">Setup</dt><dd class="font-bold">{{ setup(cliente) | currency:'BRL' }}</dd></div>
            <div class="rounded-md bg-slate-50 p-3"><dt class="text-slate-500">Mensal</dt><dd class="font-bold text-emerald-700">{{ mensal(cliente) | currency:'BRL' }}</dd></div>
          </dl>
          <button class="btn-primary mt-4 w-full">Gerar proposta</button>
        </article>
      </div>
    </section>
  `
})
export class PropostasComponent implements OnInit {
  clientes: Cliente[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getClientes().subscribe((clientes) => this.clientes = clientes);
  }

  setup(cliente: Cliente): number {
    return 1800 + Number(cliente.maquinas_instaladas || 1) * 250;
  }

  mensal(cliente: Cliente): number {
    return 690 + Number(cliente.maquinas_instaladas || 1) * 89;
  }
}
